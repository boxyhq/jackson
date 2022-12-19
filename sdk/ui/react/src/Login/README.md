# Login

## Installation

```bash
npm install @boxyhq/react-ui
```

## Usage

```tsx
import { Login } from '@boxyhq/react-ui';

// Inside render
<Login
  forwardTenant={async (tenant) => {
    // process the forwarded tenant
  }}
  label='Tenant'
/>;
```
