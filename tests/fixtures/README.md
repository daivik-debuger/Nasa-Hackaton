# NASA POWER fixtures

`nasa-power-des-moines-2025-01-01-to-2025-01-07.json` is a real saved response retrieved from the NASA POWER Daily API. Its exact request, retrieval date, intended use, and limitations are recorded in the adjacent metadata file.

The fixture is committed so tests remain deterministic and do not depend on NASA or network availability. It must not be presented as a forecast, current condition, sensor reading, or validation of a farmer's field.

Missing-value and malformed-response cases are created inside unit tests and are explicitly labeled synthetic test cases. They are not observations.
