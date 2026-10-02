package main

import (
	"context"
	"database/sql"
	"flag"
	"os"
	"time"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"k8s.io/apimachinery/pkg/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/healthz"
	"sigs.k8s.io/controller-runtime/pkg/log/zap"
	metricsserver "sigs.k8s.io/controller-runtime/pkg/metrics/server"

	saurientv1alpha1 "saurient-platform/api/v1alpha1"
	"saurient-platform/internal/controller"
	"saurient-platform/internal/engine"
	"saurient-platform/internal/repository"
)

var (
	scheme   = runtime.NewScheme()
	setupLog = ctrl.Log.WithName("setup")
)

func init() {
	utilruntime.Must(clientgoscheme.AddToScheme(scheme))
	utilruntime.Must(saurientv1alpha1.AddToScheme(scheme))
}

func main() {
	var metricsAddr string
	var enableLeaderElection bool
	var probeAddr string
	var dbConnStr string
	var redisAddr string

	flag.StringVar(&metricsAddr, "metrics-bind-address", ":8081", "The address the metric endpoint binds to.")
	flag.StringVar(&probeAddr, "health-probe-bind-address", ":8082", "The address the probe endpoint binds to.")
	flag.BoolVar(&enableLeaderElection, "leader-elect", false, "Enable leader election for controller manager.")
	flag.StringVar(&dbConnStr, "db-connection", getEnv("POSTGRES_URL", "postgresql://saurient:saurient123@postgres:5432/saurient_db?sslmode=disable"), "Database connection string.")
	flag.StringVar(&redisAddr, "redis-address", getEnv("REDIS_ADDR", "redis:6379"), "Redis server address.")

	opts := zap.Options{
		Development: true,
	}
	opts.BindFlags(flag.CommandLine)
	flag.Parse()

	ctrl.SetLogger(zap.New(zap.UseFlagOptions(&opts)))

	mgr, err := ctrl.NewManager(ctrl.GetConfigOrDie(), ctrl.Options{
		Scheme:                 scheme,
		Metrics:                metricsserver.Options{BindAddress: metricsAddr},
		HealthProbeBindAddress: probeAddr,
		LeaderElection:         enableLeaderElection,
		LeaderElectionID:       "saurient-carbonpassport-leader",
	})
	if err != nil {
		setupLog.Error(err, "unable to start manager")
		os.Exit(1)
	}

	// Initialize DB
	var pgRepo *repository.PostgresRepository
	db, err := sql.Open("postgres", dbConnStr)
	if err == nil {
		if err := db.Ping(); err == nil {
			pgRepo = repository.NewPostgresRepository(db)
			setupLog.Info("Connected to PostgreSQL database successfully")
		} else {
			setupLog.Error(err, "Warning: Postgres ping failed, continuing in standalone mode")
		}
	}

	// Initialize Redis
	var redisRepo *repository.RedisRepository
	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	pingCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := rdb.Ping(pingCtx).Err(); err == nil {
		redisRepo = repository.NewRedisRepository(rdb)
		setupLog.Info("Connected to Redis successfully")
	}

	celEngine := engine.NewCELEngine()

	if err = (&controller.CarbonPassportReconciler{
		Client:       mgr.GetClient(),
		Scheme:       mgr.GetScheme(),
		CELEngine:    celEngine,
		PostgresRepo: pgRepo,
		RedisRepo:    redisRepo,
	}).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "CarbonPassport")
		os.Exit(1)
	}

	if err = (&controller.ProductReconciler{
		Client:       mgr.GetClient(),
		Scheme:       mgr.GetScheme(),
		CELEngine:    celEngine,
		PostgresRepo: pgRepo,
		RedisRepo:    redisRepo,
	}).SetupWithManager(mgr); err != nil {
		setupLog.Error(err, "unable to create controller", "controller", "Product")
		os.Exit(1)
	}

	if err := mgr.AddHealthzCheck("healthz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up health check")
		os.Exit(1)
	}
	if err := mgr.AddReadyzCheck("readyz", healthz.Ping); err != nil {
		setupLog.Error(err, "unable to set up ready check")
		os.Exit(1)
	}

	setupLog.Info("Starting Saurient Carbon Passport Controller Manager")
	if err := mgr.Start(ctrl.SetupSignalHandler()); err != nil {
		setupLog.Error(err, "problem running manager")
		os.Exit(1)
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}
