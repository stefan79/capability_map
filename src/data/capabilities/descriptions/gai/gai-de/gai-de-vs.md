## Capability Overview
This capability enables the design, development, and deployment of AI systems that perform analytical tasks through machine learning (ML) and operations research (OR) techniques. It addresses the need to extract actionable insights from data, optimize decision-making processes, and predict future outcomes based on historical patterns. The capability supports enterprises in transforming raw data into quantifiable business value by automating complex analysis and optimization problems without prescribing specific implementation technologies.

## Business Value & Supported Use Cases
- Enables data-driven decision-making to improve operational efficiency and reduce costs.
- Supports predictive maintenance, demand forecasting, fraud detection, and customer segmentation.
- Facilitates optimization of supply chains, resource allocation, and scheduling.
- Relevant across AI adoption stages:
  - Experimentation: validating ML models and OR algorithms on pilot datasets.
  - Scale-out: expanding analytical models across multiple business units.
  - Industrialization: embedding analytical AI into core business processes.
  - Regulated production: ensuring compliance and auditability of analytical outcomes.

## Maturity Expectations
- Emerging: Basic ML models and optimization algorithms are developed in isolated projects with limited integration.
- Well-established: Analytical AI is integrated into multiple business functions with standardized model management and monitoring.
- Strategic / Differentiating: Analytical AI drives competitive advantage through advanced predictive and prescriptive capabilities embedded in enterprise workflows.
- Foundational: Analytical AI is a core component of enterprise architecture, with automated retraining, governance, and continuous performance validation at scale.
- Good maturity at scale includes robust data pipelines, model lifecycle management, and cross-functional collaboration. Under-maturity is indicated by siloed models, lack of monitoring, and inconsistent data quality.

## Mandatory vs Optional Usage
- Mandatory when:
  - Analytical AI supports regulated environments requiring traceability and auditability.
  - Deployed at enterprise scale impacting multiple business units.
  - Supporting production-critical workloads with high availability and reliability requirements.
- Optional when:
  - Limited to proof-of-concept projects or isolated teams exploring AI capabilities.
  - Used for non-critical or exploratory analyses without direct operational impact.
- The classification ensures appropriate investment in governance and operational rigor aligned with business risk and scale.

## Key Dependencies & Related Capabilities
- Technical:
  - Data ingestion and quality management capabilities.
  - Feature engineering and data transformation pipelines.
  - Model training infrastructure and deployment platforms.
- Governance:
  - AI model risk management and compliance frameworks.
  - Data privacy and security policies.
- Operational:
  - Monitoring and incident management systems.
  - MLOps processes for continuous integration and delivery.
- Related capabilities:
  - Generative AI for synthetic data augmentation.
  - Platform Operations & MLOps / LLMOps for deployment and lifecycle management.
  - Governance, Risk & Compliance for regulatory adherence.

## Risks of Omission or Poor Implementation
- Architectural risks include fragmented analytical models leading to inconsistent decision-making and duplicated efforts.
- Operational risks involve model drift, lack of monitoring, and failure to detect performance degradation.
- Compliance risks arise from inadequate audit trails, data privacy violations, and non-compliance with regulatory standards.
- Common failure modes include poor data quality, insufficient model validation, and lack of integration with business processes.

## Example Metrics & KPIs
- Model accuracy, precision, recall, and other performance indicators.
- Percentage of analytical models deployed to production versus in development.
- Time-to-deploy for new analytical models.
- Number of incidents related to model failures or data quality issues.
- Compliance audit pass rates for analytical AI systems.
- Cost savings or revenue impact attributed to analytical AI initiatives.
