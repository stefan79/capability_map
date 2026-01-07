## Capability Overview
This capability enables the design, development, and deployment of AI systems that perform analytical tasks through machine learning (ML) and operations research (OR) techniques. It addresses the need to extract insights, identify patterns, and optimize decisions based on structured and unstructured data. The capability supports enterprises in transforming raw data into actionable intelligence to improve operational efficiency, forecasting accuracy, and decision quality without prescribing specific implementation technologies.

## Business Value & Supported Use Cases
- Enables data-driven decision-making by providing predictive analytics, classification, clustering, and optimization models.
- Supports use cases such as demand forecasting, fraud detection, customer segmentation, supply chain optimization, and risk assessment.
- Relevant across AI adoption stages:
  - Experimentation: validating ML/OR models on pilot datasets.
  - Scale-out: expanding model deployment across business units.
  - Industrialization: integrating models into core business processes.
  - Regulated production: ensuring compliance and auditability in critical environments.

## Maturity Expectations
- Emerging: Initial model development with limited integration; ad hoc processes and inconsistent performance.
- Well-established: Standardized model development lifecycle, repeatable deployment pipelines, and monitored model performance.
- Strategic / Differentiating: Advanced analytics embedded in decision workflows with continuous learning and optimization; models deliver measurable business impact.
- Foundational: Enterprise-wide adoption with governance, scalability, and resilience; models are integral to automated decision systems.
- “Good” at scale means consistent model accuracy, robust validation, automated retraining, and clear lineage.
- Under-maturity signs include model drift, lack of monitoring, siloed analytics efforts, and poor integration with business processes.

## Mandatory vs Optional Usage
- Mandatory when:
  - AI models support regulated decision-making requiring transparency and audit trails.
  - Deployed at enterprise scale impacting multiple business units.
  - Supporting production-critical workflows where accuracy and reliability are essential.
- Optional when:
  - Use is limited to proof-of-concept projects or isolated teams exploring AI capabilities.
  - Supporting non-critical or exploratory analytics without direct operational impact.
- The classification reflects the risk profile and operational impact of analytical AI models within the enterprise context.

## Key Dependencies & Related Capabilities
- Technical:
  - Data ingestion and management infrastructure.
  - Feature engineering and data preprocessing pipelines.
  - Model training and evaluation environments.
- Governance:
  - AI ethics and compliance frameworks.
  - Model risk management and validation policies.
- Operational:
  - MLOps platforms for deployment and monitoring.
  - Incident management and model retraining workflows.
- Related capabilities:
  - Generative AI for synthetic data augmentation.
  - Platform Operations & MLOps/LLMOps for lifecycle management.
  - Governance, Risk & Compliance for regulatory adherence.

## Risks of Omission or Poor Implementation
- Architectural risks include fragmented analytics efforts, inconsistent data quality, and lack of integration with business systems.
- Operational risks involve model degradation, insufficient monitoring, and inability to respond to changing data patterns.
- Compliance risks arise from lack of transparency, auditability, and controls over model decisions.
- Common failure modes include model bias, overfitting, poor scalability, and failure to align models with business objectives.

## Example Metrics & KPIs
- Model accuracy, precision, recall, and other performance indicators.
- Model deployment frequency and time-to-production.
- Percentage of models monitored and retrained regularly.
- Number of incidents related to model failures or drift.
- Compliance audit pass rates for model governance.
- Business impact metrics such as cost savings or revenue uplift attributable to analytical AI models.
