package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// LocalObjectReference contains a reference to an object by name and namespace.
type LocalObjectReference struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
}

// ProductSpec defines the desired state of a Product batch.
type ProductSpec struct {
	TenantID        string               `json:"tenantID"`
	FacilityID      string               `json:"facilityID"`
	BatchID         string               `json:"batchID"`
	ProductName     string               `json:"productName"`
	CommodityType   string               `json:"commodityType"`
	ActivityDataRaw string               `json:"activityDataRaw"`
	RulebookRef     LocalObjectReference `json:"rulebookRef"`
}

// ProductStatus describes the observed state of a Product.
type ProductStatus struct {
	// Phase is one of Pending, Calculated, Failed.
	Phase            string               `json:"phase,omitempty"`
	PassportRef      LocalObjectReference `json:"passportRef,omitempty"`
	TotalFootprintKg float64              `json:"totalFootprintKg,omitempty"`
	DataHash         string               `json:"dataHash,omitempty"`
	LastUpdated      metav1.Time          `json:"lastUpdated,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:shortName=prod
type Product struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ProductSpec   `json:"spec,omitempty"`
	Status ProductStatus `json:"status,omitempty"`
}

func (in *Product) DeepCopyInto(out *Product) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	out.Spec = in.Spec
	out.Status = in.Status
}

func (in *Product) DeepCopy() *Product {
	if in == nil {
		return nil
	}
	out := new(Product)
	in.DeepCopyInto(out)
	return out
}

func (in *Product) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// +kubebuilder:object:root=true
type ProductList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Product `json:"items"`
}

func (in *ProductList) DeepCopyInto(out *ProductList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]Product, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

func (in *ProductList) DeepCopy() *ProductList {
	if in == nil {
		return nil
	}
	out := new(ProductList)
	in.DeepCopyInto(out)
	return out
}

func (in *ProductList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}
