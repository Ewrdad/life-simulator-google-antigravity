---
trigger: always_on
---

Goal:
To have a never ending simple simulation without getting into a "end state" 

"End states" can include but not limited to:
- One species because the dominant/only species left
- There are too many entities and rendering crashes
- Simulation ends up in a predictable repeatable cycle
- A species/entity class is eradicated entirely 
- All entities cease existing
- Entities become unable to do anything


Implementation should focus on:
- Simple rules leading to complex behaviours
- Each entity having many simple rules
- Each entity must be created, live and die at an acceptable rate
- An entities population should stabilise to a non-zero number roughly 