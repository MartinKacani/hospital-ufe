# tjmk-medbed-app



<!-- Auto Generated Below -->


## Properties

| Property       | Attribute       | Description | Type     | Default     |
| -------------- | --------------- | ----------- | -------- | ----------- |
| `apiBase`      | `api-base`      |             | `string` | `undefined` |
| `basePath`     | `base-path`     |             | `string` | `''`        |
| `departmentId` | `department-id` |             | `string` | `undefined` |


## Dependencies

### Depends on

- [tjmk-medbed-reservation-editor](../tjmk-medbed-reservation-editor)
- [tjmk-medbed-stay-editor](../tjmk-medbed-stay-editor)
- [tjmk-medbed-reservation-list](../tjmk-medbed-reservation-list)
- [tjmk-medbed-stay-list](../tjmk-medbed-stay-list)

### Graph
```mermaid
graph TD;
  tjmk-medbed-app --> tjmk-medbed-reservation-editor
  tjmk-medbed-app --> tjmk-medbed-stay-editor
  tjmk-medbed-app --> tjmk-medbed-reservation-list
  tjmk-medbed-app --> tjmk-medbed-stay-list
  style tjmk-medbed-app fill:#f9f,stroke:#333,stroke-width:4px
```

----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
