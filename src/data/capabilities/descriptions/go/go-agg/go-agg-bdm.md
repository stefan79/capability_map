## Capability Overview
Analytical AI encompasses the use of machine learning (ML) and operations research (OR) techniques to analyze data, identify patterns, and generate actionable insights. This capability addresses the need for data-driven decision-making by enabling predictive modeling, optimization, and statistical analysis across diverse enterprise domains. It solves problems related to forecasting, anomaly detection, resource allocation, and process improvement without prescribing specific implementation technologies.

## Business Value & Supported Use Cases
- Enables improved decision accuracy and operational efficiency through predictive analytics and optimization.
- Supports use cases such as demand forecasting, fraud detection, supply chain optimization, customer segmentation, and risk assessment.
- Relevant primarily during:
  - Experimentation: validating models and approaches on pilot data sets.
  - Scale-out: expanding analytical models across business units.
  - Industrialization: embedding models into automated workflows.
  - Regulated production: ensuring compliance and auditability in critical environments.

## Maturity Expectations
- Emerging: Basic experimentation with ML models and optimization algorithms, limited integration with business processes.
- Well-established: Repeatable model development lifecycle, integration with enterprise data sources, and initial deployment in production.
- Strategic / Differentiating: Advanced analytics embedded in core business processes with continuous model retraining and performance monitoring.
- Foundational: Scalable, automated analytical pipelines with governance controls, standardized model validation, and cross-functional adoption.
- “Good” at scale means consistent model performance, low operational risk, and measurable business impact.
- Under-maturity signs include ad hoc modeling, lack of version control, poor data quality, and absence of monitoring.

## Mandatory vs Optional Usage
- Mandatory when:
  - Analytical models support regulated decision-making or compliance reporting.
  - Deployed at enterprise scale impacting multiple business units.
  - Supporting production-critical workflows requiring high availability and reliability.
- Optional when:
  - Limited to proof-of-concept projects or isolated teams exploring data insights.
  - Use cases are exploratory or non-critical without direct business impact.
- This classification ensures appropriate investment in governance and operational rigor proportional to risk and scale.

## Key Dependencies & Related Capabilities
- Technical:
  - Reliable data ingestion and management infrastructure.
  - Feature engineering and data preprocessing capabilities.
- Governance:
  - Model risk management and validation frameworks.
  - Data privacy and ethical use policies.
- Operational:
  - MLOps for deployment, monitoring, and lifecycle management.
  - Integration with business process automation.
- Related capabilities:
  - Generative AI for synthetic data augmentation.
  - Platform Operations & MLOps / LLMOps for operational resilience.
  - Governance, Risk & Compliance for regulatory adherence.

## Risks of Omission or Poor Implementation
- Architectural risks include siloed models, inconsistent data sources, and lack of scalability.
- Operational risks involve model drift, unmonitored performance degradation, and failure to update models.
- Compliance risks arise from inadequate audit trails, biased models, or non-compliance with data regulations.
- Typical failure modes include inaccurate predictions, delayed insights, and inability to respond to changing business conditions.

## Example Metrics & KPIs
- Model accuracy, precision, recall, and other performance indicators.
- Percentage of analytical models deployed to production versus in experimentation.
- Mean time to detect and remediate model performance issues.
- Number of business processes augmented or automated by analytical AI.
- Compliance audit pass rates related to model governance.
- Cost efficiency measured by resource utilization and time-to-insight.
