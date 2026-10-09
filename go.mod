module saurient-platform

go 1.26.0

require (
	cel.dev/cel-go v0.32.0
	github.com/elliotchance/orderedmap v1.8.0
	github.com/golang/protobuf v1.5.4
	github.com/google/uuid v1.6.0
	github.com/rs/cors v1.11.1
	github.com/sirupsen/logrus v1.10.2
	github.com/vektah/gqlparser/v2 v2.5.0
	github.com/vmware-tanzu/graph-framework-for-microservices/gqlgen v0.0.0-00010101000000-000000000000
	github.com/vmware-tanzu/graph-framework-for-microservices/nexus v0.0.0-00010101000000-000000000000
	google.golang.org/grpc v1.79.3
	k8s.io/apimachinery v0.29.2
	k8s.io/client-go v0.29.2
	saurient-platform/datamodel v0.0.0-00010101000000-000000000000
)

replace github.com/vmware-tanzu/graph-framework-for-microservices/gqlgen => ../graph-framework-for-microservices/gqlgen

replace github.com/vmware-tanzu/graph-framework-for-microservices/nexus => ../graph-framework-for-microservices/nexus

replace saurient-platform/datamodel => ./datamodel

require (
	cel.dev/expr v0.25.2 // indirect
	github.com/agnivade/levenshtein v1.1.1 // indirect
	github.com/antlr4-go/antlr/v4 v4.13.1 // indirect
	github.com/cpuguy83/go-md2man/v2 v2.0.1 // indirect
	github.com/davecgh/go-spew v1.1.2-0.20180830191138-d8f796af33cc // indirect
	github.com/emicklei/go-restful/v3 v3.11.0 // indirect
	github.com/evanphx/json-patch v4.12.0+incompatible // indirect
	github.com/go-logr/logr v1.4.3 // indirect
	github.com/go-openapi/jsonpointer v0.19.6 // indirect
	github.com/go-openapi/jsonreference v0.20.2 // indirect
	github.com/go-openapi/swag v0.22.3 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/google/gnostic-models v0.6.8 // indirect
	github.com/google/go-cmp v0.7.0 // indirect
	github.com/google/gofuzz v1.2.0 // indirect
	github.com/gorilla/websocket v1.5.0 // indirect
	github.com/hashicorp/golang-lru v0.5.4 // indirect
	github.com/imdario/mergo v0.3.6 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/json-iterator/go v1.1.12 // indirect
	github.com/mailru/easyjson v0.7.7 // indirect
	github.com/mitchellh/mapstructure v1.3.1 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/pkg/errors v0.9.1 // indirect
	github.com/rogpeppe/go-internal v1.14.1 // indirect
	github.com/russross/blackfriday/v2 v2.1.0 // indirect
	github.com/spf13/pflag v1.0.10 // indirect
	github.com/urfave/cli/v2 v2.8.1 // indirect
	github.com/xrash/smetrics v0.0.0-20201216005158-039620a65673 // indirect
	go.yaml.in/yaml/v2 v2.4.3 // indirect
	go.yaml.in/yaml/v3 v3.0.5 // indirect
	golang.org/x/exp v0.0.0-20260410095643-746e56fc9e2f // indirect
	golang.org/x/mod v0.38.0 // indirect
	golang.org/x/net v0.58.0 // indirect
	golang.org/x/oauth2 v0.36.0 // indirect
	golang.org/x/sync v0.22.0 // indirect
	golang.org/x/sys v0.47.0 // indirect
	golang.org/x/term v0.45.0 // indirect
	golang.org/x/text v0.41.0 // indirect
	golang.org/x/time v0.15.0 // indirect
	golang.org/x/tools v0.48.0 // indirect
	google.golang.org/genproto/googleapis/api v0.0.0-20260526163538-3dc84a4a5aaa // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260526163538-3dc84a4a5aaa // indirect
	google.golang.org/protobuf v1.36.12-0.20260120151049-f2248ac996af // indirect
	gopkg.in/inf.v0 v0.9.1 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
	k8s.io/api v0.29.2 // indirect
	k8s.io/klog/v2 v2.110.1 // indirect
	k8s.io/kube-openapi v0.0.0-20231010175941-2dd684a91f00 // indirect
	k8s.io/utils v0.0.0-20260108192941-914a6e750570 // indirect
	sigs.k8s.io/json v0.0.0-20221116044647-bc3834ca7abd // indirect
	sigs.k8s.io/structured-merge-diff/v4 v4.4.1 // indirect
	sigs.k8s.io/yaml v1.6.0 // indirect
)
