# AW9523

An LED friendly, but also generally useful, Gpio device.

[![npm Version](http://img.shields.io/npm/v/@johntalton/aw9523.svg)](https://www.npmjs.com/package/@johntalton/aw9523)
![GitHub package.json version](https://img.shields.io/github/package-json/v/johntalton/aw9523)
[![CI](https://github.com/johntalton/aw9523/actions/workflows/CI.yaml/badge.svg)](https://github.com/johntalton/aw9523/actions/workflows/CI.yaml)
![GitHub](https://img.shields.io/github/license/johntalton/aw9523)
[![Downloads Per Month](http://img.shields.io/npm/dm/@johntalton/aw9523.svg)](https://www.npmjs.com/package/@johntalton/aw9523)
![GitHub last commit](https://img.shields.io/github/last-commit/johntalton/aw9523)

# Example

Individual Pins need to be set to LED Mode in order to use Dimming

```javascript
import { I2CAddressedBus } from '@johntalton/and-other-delights'
import { AW9523, DEFAULT_ADDRESS, SET } from '@johntalton/aw9523'

const bus = /* I2CBus */
const aBus = new I2CAddressBus(bus, DEFAULT_ADDRESS)
const device = new AW9523(device)

const id = await device.getId()

const port = 0
const pin = 2
const dim = 42

const { mode } = await device.getMode(port)
mode[pin] = SET // update mode array for this Pin
await device.setMode(port, mode)
await device.setDimming(port, pin, dim)

```