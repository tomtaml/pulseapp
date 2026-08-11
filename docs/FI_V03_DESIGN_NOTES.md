# Finland v0.3 design rationale

The Finland workshop prototype deliberately has two participant-facing routes that share the same Tampere wireless-V2G concept but represent different decision contexts.

## Fleet route

Primary users: fleet drivers, dispatch/operations and fleet managers.

The route exposes operational constraints that can later become design requirements or DCE attributes:

- winter alignment conditions
- current battery state of charge
- guaranteed departure state of charge
- departure time
- dwell time
- V2G window
- maximum export
- compensation
- emergency override / mobility protection
- fault handling and alternative charging

## Citizen / accessibility route

Primary users: citizens, nearby road users and accessibility/vulnerable-group representatives.

Participants see the same fictional Tampere delivery-van system so their usability and comprehension ratings refer to the same interface concept. They are not asked to make artificial fleet-operational choices. The route instead tests whether the public-facing explanation makes clear:

- how cable-free charging works
- how alignment / charging status is communicated
- what V2G means
- that a guaranteed mobility reserve is protected
- that the driver/fleet can stop V2G
- who is responsible during a fault
- whether the public-space use is acceptable and accessible

## Measurement separation

The prototype keeps these constructs separate:

1. task / plan comprehension
2. 10-item SUS after hands-on use
3. trust
4. responsibility and fault-handling clarity
5. accessibility / unaided understanding
6. wireless-charging acceptance
7. V2G participation or public acceptability

This prevents SUS from becoming a proxy for trust or technology acceptance, and prevents wireless-charging acceptance from being conflated with willingness to participate in bidirectional energy services.
