## Capability Overview
This capability enables the design, development, and deployment of AI systems that perform analytical tasks through machine learning (ML) and operations research (OR) techniques. It addresses the need to extract actionable insights from data, optimize complex processes, and support decision-making with predictive and prescriptive models. The capability focuses on solving problems related to pattern recognition, forecasting, classification, and optimization without embedding generative or autonomous agent behaviors.

## Business Value & Supported Use Cases
- Enables improved decision accuracy and operational efficiency through data-driven insights.
- Supports use cases such as demand forecasting, fraud detection, customer segmentation, supply chain optimization, and risk modeling.
- Relevant across AI adoption stages:
  - Experimentation: validating ML/OR approaches on pilot datasets.
  - Scale-out: expanding successful models across business units.
  - Industrialization: embedding models into standardized workflows.
  - Regulated production: ensuring compliance and auditability in critical environments.

## Maturity Expectations
- Emerging: Basic ML/OR models developed in isolated projects with limited integration and governance.
- Well-established: Repeatable model development lifecycle with version control, monitoring, and cross-team collaboration.
- Strategic / Differentiating: Advanced analytical models integrated into core business processes, delivering measurable competitive advantage.
- Foundational: Enterprise-wide standardized frameworks for model development, deployment, monitoring, and lifecycle management with strong governance.
- “Good” at scale means consistent model performance, automated retraining, robust validation, and transparent audit trails.
- Under-maturity signs include ad hoc model usage, lack of monitoring, poor data quality, and absence of governance controls.

## Mandatory vs Optional Usage
- Mandatory when:
  - Analytical AI models support production-critical decision-making.
  - Operating in regulated industries requiring model transparency and auditability.
  - Deployed at enterprise scale with cross-functional dependencies.
- Optional when:
  - Used solely for proof-of-concept or exploratory analysis.
  - Limited to isolated teams without integration into operational systems.
- The classification reflects the risk profile and operational impact of the models developed under this capability.

## Key Dependencies & Related Capabilities
- Technical:
  - Data engineering and feature store capabilities for reliable data pipelines.
  - Model training infrastructure and experimentation platforms.
- Governance:
  - AI model risk management and compliance frameworks.
  - Data privacy and security controls.
- Operational:
  - MLOps for deployment, monitoring, and lifecycle management.
  - Incident management and model retraining processes.
- Related capabilities:
  - Generative AI for content creation use cases.
  - Platform Operations & MLOps / LLMOps for operationalizing models.
  - Governance, Risk & Compliance for regulatory adherence.

## Risks of Omission or Poor Implementation
- Architectural risks include fragmented model development, inconsistent data usage, and lack of integration with business processes.
- Operational risks involve model drift, performance degradation, and insufficient monitoring leading to erroneous decisions.
- Compliance risks arise from inadequate documentation, lack of explainability, and failure to meet regulatory requirements.
- Common failure modes include siloed analytics efforts, unmanaged model proliferation, and absence of retraining strategies.

## Example Metrics & KPIs
- Model accuracy, precision, recall, and other performance indicators.
- Percentage of models deployed to production versus in experimentation.
- Model retraining frequency and time-to-deployment.
- Number of incidents related to model failures or data issues.
- Compliance audit pass rates and documentation completeness.
- Resource utilization and cost per model lifecycle stage.
