# Data Model

<!-- sdlc:auto:start entities -->
### note

| Field | Type | PK | FK | Nullable |
|---|---|---|---|---|
| id | string (uuid) | True | — | False |
| title | string | False | — | True |
| body | text | False | — | False |
| created_at | timestamp (epoch ms) | False | — | False |
| updated_at | timestamp (epoch ms) | False | — | False |
<!-- sdlc:auto:end entities -->

<!-- sdlc:auto:start relationships -->
_No relationships recorded._
<!-- sdlc:auto:end relationships -->

<!-- sdlc:auto:start er-diagram -->
```mermaid
erDiagram
  note {
    string__uuid_ id PK
    string title
    text body
    timestamp__epoch_ms_ created_at
    timestamp__epoch_ms_ updated_at
  }
```
<!-- sdlc:auto:end er-diagram -->
