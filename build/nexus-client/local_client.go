// Hand-written extension, installed by scripts/build_datamodel.sh.
package nexus_client

import baseClientset "saurient-platform/build/client/clientset/versioned"

// NewWithBaseClient wraps a local object store using the generated graph API.
func NewWithBaseClient(base baseClientset.Interface) *Clientset {
	client := NewFakeClient()
	client.baseClient = base
	return client
}

// BaseClient exposes the typed transport for datamodel event subscriptions.
func (c *Clientset) BaseClient() baseClientset.Interface { return c.baseClient }

// Graph index accessors keep event subscriptions isolated to this client.
func (c *Clientset) AddGraphChild(parentType, parent, childType, child string) {
	c.children.AddChild(parentType, parent, childType, child)
}
func (c *Clientset) RemoveGraphChild(parentType, parent, childType, child string) {
	c.children.RemoveChild(parentType, parent, childType, child)
}
func (c *Clientset) GraphChildren(parentType, parent, childType string) []string {
	return c.children.GetChildren(parentType, parent, childType)
}
