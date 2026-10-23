package nexus

import (
	"context"
	"encoding/json"
	"sort"
	"time"
)

// Caller holds e.mu. All durable correction history is read from Nexus; clearing
// these maps or recreating the engine cannot discard a correction.
func (e *NexusGraphEngine) restoreLineageProjection(ctx context.Context) error {
	records, err := listInputCorrections(ctx, GetNexusClient())
	if err != nil {
		return err
	}
	e.nodes = make(map[string]LineageNode)
	e.edges = make(map[string]LineageEdge)
	e.seedDefaultGraphTopologyLocked()
	sort.Slice(records, func(i, j int) bool {
		a, _ := time.Parse(time.RFC3339Nano, records[i].Spec.CreatedAt)
		b, _ := time.Parse(time.RFC3339Nano, records[j].Spec.CreatedAt)
		if a.Equal(b) {
			return records[i].Name < records[j].Name
		}
		return a.Before(b)
	})
	for _, record := range records {
		var nodes map[string]LineageNode
		var edges map[string]LineageEdge
		if record.Spec.NodesRaw != "" {
			if err := json.Unmarshal([]byte(record.Spec.NodesRaw), &nodes); err != nil {
				return err
			}
		}
		if record.Spec.EdgesRaw != "" {
			if err := json.Unmarshal([]byte(record.Spec.EdgesRaw), &edges); err != nil {
				return err
			}
		}
		for id, node := range nodes {
			e.nodes[id] = node
		}
		for id, edge := range edges {
			e.edges[id] = edge
		}
	}
	return nil
}
