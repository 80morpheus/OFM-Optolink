# OFM-Optolink

## Hardware support

At the moment we support following hardware:

- OpenKNX Reg1 Base
- OpenKNX UP1 GW UART

Can be selected in the ETS.

## Optolink model

The address table defaults to model 200A. To select a different table, define
exactly one of `OPTOMODULE_200A`, `OPTOMODULE_250A`, or `OPTOMODULE_300A` in
the build flags.
