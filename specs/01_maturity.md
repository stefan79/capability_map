
  # Maturity Model Update Spec
  *Owner:* Stefan Siprell
  *Date:* 2025-11-10
  *Related work:* ./.

## 1. Problem & Goals
  - **Why now:** Steering Comittee wants to be able to track the progress of the capability realization on more than just the HVIA usage. 
  - **Success criteria:** The new visualization shows the capabiltiy maturity on a single view, allows a drill down in the various dimensions via a tool-tip per capability and we can import an excel file with preliminary maturity definitions. 

## 2. Updated Maturity Definition

### 2.1 Overview

| Dimension  | Subdimension              | Criteria                                                                                                                       | Range | Weight |
| ---------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----- | ------ |
| Adoption   | Use Case Adoption         | Is the capability actively used across multiple business use cases?​                                                           | 1..4  | 1      |
| Technology | Adoption Effort           | Can the capability be adapted to specific use cases without significant integration effort or complexity?​                     | 1..4  | 1      |
|            | Development activity​     | Is the capabilitiy being actively developed?                                                                                   | 1..4  | 1      |
| Process    | Documentation             | Are there resources and templates outlining how to integrate, configure, and effectively use the capability?​                  | 1..4  | 1      |
|            | Self-service​             | Can users effectively provision, configure, and onboard without relying on manual intervention or support from central teams?​ | 1..4  | 1      |
| People     | Roles & responsibilities​ | Are there clear ownership and responsibilities defined?​                                                                       | 1..4  | 1      |
|            | Skills​                   | Does the organization have the right technical and domain skills to utilize and develop the capability further?​               | 1..4  | 1      |
|            | Capacity                  | Is there sufficient capacity to implement the capability at the required pace?​                                                | 1..4  | 1      |
|            | Product guidance​         | Are users supported through guidance and upskilling to effectively use the capability? ​                                       | 1..4  | 1      |

We want to define the maturity of the capabilities using an extension of the current data model. Eventhough we track the maturity on the capability, we will be attaching the dimension to the source of the dimension: 

* **Implementation**: The foundation product determines how to self-service provision a capability, or how well its team and skills are set-up.
* **Capability**: Has its own unique maturity dimensions such as documentation
* **HVIA:** And the last set of dimensions is driven by the HVIA themselves such as the adoption of the capability across use cases.

All of the dimensions have the same value range and can be summarized as:

- 0 - Not Implemented (Occurs if the capability has no implementations)
- 1 - Early Stages
- 2 - Developing
- 3 - Established
- 4 - Mature

To calculate the total maturity score we will use weighted averages:
- Determine the Maturity per Subdimension
- Calculate Weighted Average per Dimension, assuming they all have the same weight of 1
- Calculate Weighted Average across all Dimensions, assuming they all have the same weight of 1

The weights should be all modeled as configuration values and coded as 1 for later easy adoption.

### 2.2 Conceptual Model
  - **Capability maturity rules:** 
	  - **Adoption Effort:** 
		  - Adoption relies on custom setups with workarounds and limited reusability​: _1 - Early Stages_
		  - Core functionality reusable; rigid interfaces still require workarounds​​: _2 - Developing_
		  - Most functionality reusable via standard interfaces; minor workarounds for niche needs​: _3 - Established_
		  - Fully reusable and flexible interfaces requiring minimal integration effort​: _4- Mature_
	  - **Development Activity:**
		  - Minimal activity with no defined roadmap​​: _1 - Early Stages_
		  - Critical fixes delivered, improvements made ad hoc​​​: _2 - Developing_
		  - Development follows a roadmap and backlog, with semi-regular releases​​: _3 - Established_
		  - Development follows a roadmap based on a prioritized backlog, with continuous delivery​​: _4- Mature_
	  - **Documentation :** 
		  - Minimal documentation exists; not actively maintained and no single source of truth: _1 - Early Stages_, 
		  - Core processes documented with basic version control and ownership defined​: _2 - Developing_, 
		  - Documentation covers most capabilities; includes examples, actively updated and reviewed​: _3 - Established_,
		  - Documentation provides full coverage with reusable templates; established version control and ownership​: _4 - Mature_  
  -  **HVIA maturity rules:** 
	  - **Use Case Adoption :** 
		  - 0 .. 2 Use Cases: _1 - Early Stages_, 
		  - 3 .. 5 Use Cases: _2 - Developing_, 
		  - 6 ... 10 Use Cases: _3 - Established_,
		  - More than 10 Use Cases: _4 - Mature_
  - **Implementation maturity rules:** 
	  - **Self-Service :** 
		  - No clear path to access the capability; access requires manual requests to individuals​: _1 - Early Stages_, 
		  - Basic self-service access available through forms; approval process remains mostly manual​​: _2 - Developing_, 
		  - Access available through standardized forms; approvals largely automated​​: _3 - Established_,
		  - Fully automated self-service process where possible, enabling auto-approval in applicable cases​​: _4 - Mature_
	  - **Roles & responsibilities​ :** 
		  - No defined ownership or governance touchpoints​​​: _1 - Early Stages_, 
		  - Owner identified; some touchpoints in place​​​​: _2 - Developing_, 
		  - Owner and all touchpoints established​​​​: _3 - Established_,
		  - Ownership formalized; escalation path and backups defined​​​​: _4 - Mature_, 
	  - **Skills​ :** 
		  - Organization has insufficient skills to implement the capability at scale​​​​​: _1 - Early Stages_, 
		  - Organization has the skills to implement the capability at a basic level​​​​​​: _2 - Developing_, 
		  - Organization has the skills to implement the capability at an intermediate level​​​​​​: _3 - Established_,
		  - Organization has the skills to implement the capability at an advanced level​​​​​​: _4 - Mature_, 
	  - **Capacity​ :** 
		  - Limited delivery capacity​​​​​​: _1 - Early Stages_, 
		  - Sufficient capacity to support a few use cases, long lead times​​​​​​​: _2 - Developing_, 
		  - Sufficient capacity to support prioritized use cases​​​​​​​: _3 - Established_,
		  - Sufficient, predictable capacity to support most use cases​​​​​​​​: _4 - Mature_, 
	  - **Product Guidance​ :** 
		  - No playbooks or learning resources​​​​​​​​: _1 - Early Stages_, 
		  - Scattered documentation; ad-hoc guidance on request​​​​​​​​​: _2 - Developing_, 
		  - Curated playbooks and upskilling materials available​​​​​​​​​: _3 - Established_,
		  - Established learning paths and training with clear support contacts.​​​​​​​​​​: _4 - Mature_,   
### 2.3 Data & Type Changes

  - **New/updated fields:** 
	  - Extend the capabilities, tools (often referred to as implementation in this document) and HVIAS to include the mentioned maturity sub dimensions according to chapter 2.2. Each subdimension should have a key, the numeric value and a reason.,
	  - Extend the capabilites, tools, and HVIAS to contain an optional reviewed flag and set the flag to false for all existing entries.
  - **Loader impact:** 
	  - When loading the data each capability needs a total weighted maturity, a dictionary of dimensions., their respected weighted maturity with an additional dictionary of the raw maturities keyed by the subdimension id. 
	  - If a capability has 0 tools implementations then all subdimensions, dimensions and total maturity will be set to 0.
	  - Similar to the other models the dimensions and subdimensions have mnemoic ids, use a compounded mnemonic for the subdimensions, to simplify referring them.
  - **Validation constraints:** 
	  - Each dimension and subdimension needs to be registered via a configuration to manage the weights, if a capability / tool / hvia refers to an unknown id abort loading with an error
	  - Ensure that the dimension and subdimension ids are unique in the same "symbol table".
	  - Capabilities without a tool cannot have an implementation in an HVIA.

## 3. Main View Rendering (`src/views/capability-view/`)
### 3.1 Visual Treatment
  - **Tile states:**  
	  - Maintain the Capability Label, the Tool Vendor Logo / Capability Type Indicator, the requirement and use case count
	  - Maintain the layout logic and coloring of the capability groups
	  - Create Buckets for the Overall Maturity (0.0, (0, 1], (1, 2], (2, 3], (3, 4]), Use the colors grey, red, orange, yellow, green, Create 4 Subuckets for each Bucket with equal distance and transition the colors accordingly. So there should be 20 colour bands transitioning lineary from grey to green over the bucket colors.
	  - Use the background colour for the capability tile
  - **Bar/segments logic:** 
	  - Remove the current segments completely and all attached / relevant code
  - **Empty/missing states:** 
	  - If a capability has a maturity of 0, then use the current background color as tile colour.
  - **Responsive notes:** 
	  - Maintain current behavior

### 3.2 Interaction & Filtering
  - **HVIA filter changes:** 
	  - Maintain Current Behaviour
  - **Hover/focus behavior:** 
	  - Ensure that the entire tooltip is visible in the viewport. Currently the tooltip is offset to the right of the cursor position. If opening the tooltip in the lower / right area it sill not be fully visible. Adjust the positioning to the top / left so the tooltip is completely visible.


### 3.3 Acceptance Examples
  
  1. **Regular View** All tiles have a background color based on the maturity
  2. **Default Tool Tips** Hovering over a tile shows a tool tip
  3. **Adjusted Tool Tips** Hovering over a tile in the lower  right section moves the tool tip into view
  4. **0 Maturity** A capability without any tools is shown as 0 Maturity
  5. **Tool Tip Content** If a tooltip is loaded, show the maturity between tool description and the HVIA use case list.
  6. **0 Maturity Tool Tip Content** Do not show the tooltip maturity section if the maturity is set to 0.


## 4. Tooltip Update (`src/views/capability-view/capability-view.ts`)
### 4.1 Content Structure
  - **Sections order:** Capability Title, Capability Description, Implementation / Tool,  Maturity Radaar, HVIA blocks
  - **New diagram description:** For now we show just a diagram

### 4.2 Diagram Specs
  - **Diagram type:** Show a Radar Diagram (circle) to show the individual capabilities (use icons to indicate the capability defined in the capability
  - **Data mapping:** 
    -  Show the individual capabilities (use icons to indicate the capability defined in the capability configuration), fill in the shape using a default color and use rounded / bezier edges
    - Create Pie Like Segments for the main dimensions using different background colors and write the name of the dimension on the edge outside of the circle
    - Create a circular arc  for the weighted dimension spanning the pie segment of the dimension, use the weighted dimenion value to calcuate the distance. The arcs are not connected and there is no need to transition.
  - **Styling tokens:** 
    - Use unique colors (see configuration of dimensions) for each dimension, use it as base for the segment background color (a lighter version), for the colour of the arc and colour the symbols of the sub dimensions using the color
    - Pick matching SVG based icons for the dimensions
  - **Fallback behavior:** 
	  - None required, if the maturity is 0 the entire section is skipped

### 4.3 Interaction
  - **Hover/legend:** No Hover, no tooltips, later we may add additional tooltips or show capabilties in a modal detail window with larger screen-estate to show more details
  - **Linkage to main tile:** None