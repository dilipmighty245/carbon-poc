# Title

**Author:**   
**Approver:**   
**Date:** Jan 21, 2026  
**Status:** Draft  
**Related:**   
---

# Background

*The Background section sets the stage for what problem is being solved. It is typically written in prose and is a paragraph or two long.  It often includes contextual information about the component being described, its history, and its place in the broader Tanzu Platform.*

# High-level Design

*The High-level Design section gives a tl;dr explanation of the design.  Its centerpiece is almost always a high-level diagram followed by a couple of paragraphs describing the contents of the diagram.  If you need more than a couple of paragraphs, you’re probably going into too much detail.*

# *Additional Sections*

*Additional sections are included at the discretion of the author and approver.  Remembering that you are attempting to define the architecture at a high-level, the following is a non-exhaustive list of sections you and your approver might want included in the document:*

* *High-level API surface is described, including any GraphQL prefixes for new subsystem types*  
* *Interactions with other services*  
* *RBAC permissions including scopes and checks*  
* *Security aspects such as persistence of passwords/secrets and use of cryptography*  
* *Backup and restore strategies for any local state*  
* *HA and DR concerns for any local state or any components with special requirements (e.g. placement)*  
* *Scalability concerns for very small or very large installations*  
* *Potential noisy-neighbor issues, both outbound and inbound*  
* *Any non-standard backwards compatibility decisions (e.g. not supporting TPS Tile N-1, 2 years support windows)*