# Why

Because regexp is still too diffcult for some people. 😂

# How

```javascript
import compile from "simple-match-exp"

const func4 = compile("A&&C||D&&E && !B")

console.assert(func4("cjaijejoifAC"))
```