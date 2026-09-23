package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

type CalculationRulebookSpec struct {
	CommodityType  string  `json:"commodityType"`
	Version        string  `json:"version"`
	Scope1Formula  string  `json:"scope1Formula"`
	Scope2Formula  string  `json:"scope2Formula"`
	Scope3Formula  string  `json:"scope3Formula"`
	FunctionalUnit string  `json:"functionalUnit"`
	BatchQuantity  float64 `json:"batchQuantity,omitempty"`
}

// +kubebuilder:object:root=true
type CalculationRulebook struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec CalculationRulebookSpec `json:"spec,omitempty"`
}

func (in *CalculationRulebook) DeepCopyInto(out *CalculationRulebook) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ObjectMeta.DeepCopyInto(&out.ObjectMeta)
	out.Spec = in.Spec
}

func (in *CalculationRulebook) DeepCopy() *CalculationRulebook {
	if in == nil {
		return nil
	}
	out := new(CalculationRulebook)
	in.DeepCopyInto(out)
	return out
}

func (in *CalculationRulebook) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}

// +kubebuilder:object:root=true
type CalculationRulebookList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []CalculationRulebook `json:"items"`
}

func (in *CalculationRulebookList) DeepCopyInto(out *CalculationRulebookList) {
	*out = *in
	out.TypeMeta = in.TypeMeta
	in.ListMeta.DeepCopyInto(&out.ListMeta)
	if in.Items != nil {
		in, out := &in.Items, &out.Items
		*out = make([]CalculationRulebook, len(*in))
		for i := range *in {
			(*in)[i].DeepCopyInto(&(*out)[i])
		}
	}
}

func (in *CalculationRulebookList) DeepCopy() *CalculationRulebookList {
	if in == nil {
		return nil
	}
	out := new(CalculationRulebookList)
	in.DeepCopyInto(out)
	return out
}

func (in *CalculationRulebookList) DeepCopyObject() runtime.Object {
	if c := in.DeepCopy(); c != nil {
		return c
	}
	return nil
}
