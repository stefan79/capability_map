## Capability Overview
Analytical AI encompasses the use of machine learning (ML) and operations research (OR) techniques to analyze data, identify patterns, and generate actionable insights. This capability addresses the need for data-driven decision-making by enabling predictive, prescriptive, and diagnostic analytics across enterprise functions. It solves problems related to forecasting, optimization, anomaly detection, and classification without relying on generative content creation. Analytical AI supports structured and unstructured data analysis to improve operational efficiency, customer understanding, and risk management.

## Business Value & Supported Use Cases
- Enables improved decision accuracy and speed through predictive analytics and optimization models.
- Supports use cases such as demand forecasting, fraud detection, supply chain optimization, customer segmentation, and risk scoring.
- Relevant across AI adoption stages:
  - Experimentation: prototyping models on historical data.
  - Scale-out: deploying models across multiple business units.
  - Industrialization: integrating analytics into core business processes.
  - Regulated production: ensuring compliance and auditability in regulated domains.

## Maturity Expectations
- Emerging: Basic model development with limited integration; ad hoc use of ML or OR techniques.
- Well-established: Standardized model development lifecycle, repeatable deployment, and monitoring practices.
- Strategic / Differentiating: Advanced analytics embedded in decision workflows with continuous learning and optimization.
- Foundational: Enterprise-wide adoption with governance, scalability, and robust operationalization ensuring reliability and compliance.
- “Good” at scale means models are reproducible, monitored for drift, integrated with business systems, and aligned with governance policies.
- Under-maturity is indicated by siloed experiments, lack of model validation, poor data quality, and absence of monitoring.

## Mandatory vs Optional Usage
- Mandatory when:
  - Analytical AI supports production-critical decisions impacting revenue, compliance, or operational risk.
  - Deployed at enterprise scale requiring consistent governance and lifecycle management.
  - Used in regulated industries where auditability and explainability are required.
- Optional when:
  - Limited to proof-of-concept projects or isolated teams exploring AI capabilities.
  - Applied to non-critical or exploratory analyses without direct business impact.
- The classification reflects the need for rigor and control proportional to the risk and scale of deployment.

## Key Dependencies & Related Capabilities
- Technical:
  - Data infrastructure and quality management.
  - Feature engineering and data labeling capabilities.
  - Model training and validation environments.
- Governance:
  - AI model risk management and compliance frameworks.
  - Ethical AI and explainability standards.
- Operational:
  - MLOps pipelines for deployment, monitoring, and retraining.
  - Integration with business process automation.
- Related capabilities:
  - Generative AI (for complementary content creation).
  - Platform Operations & MLOps / LLMOps (for lifecycle management).
  - Governance, Risk & Compliance (for oversight and controls).

## Risks of Omission or Poor Implementation
- Architectural risks include fragmented model development, lack of scalability, and integration failures.
- Operational risks involve model degradation, unmonitored drift, and insufficient retraining leading to inaccurate predictions.
- Compliance risks arise from lack of transparency, audit trails, and controls, potentially violating regulatory requirements.
- Typical failures include siloed analytics efforts, inconsistent data usage, and inability to operationalize insights effectively.

## Example Metrics & KPIs
- Model accuracy, precision, recall, and other performance indicators.
- Percentage of models deployed to production versus prototypes.
- Model monitoring coverage and frequency of retraining cycles.
- Time-to-deploy and time-to-value for analytical models.
- Compliance audit pass rates and explainability scores.
- Business impact metrics such as cost savings or revenue uplift attributable to analytical AI.
