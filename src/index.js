export const DEFAULT_ADDRESS = 0x58

export const DEVICE_ID = 0x23

export const SET = 1
export const UNSET = 0

export const HIGH = 1
export const LOW = 0

export const DIRECTION_OUTPUT = UNSET
export const DIRECTION_INPUT = SET

export const INTERRUPT_ENABLE = UNSET
export const INTERRUPT_DISABLE = SET

export const MODE_GPIO = SET
export const MODE_LED = UNSET

export const PORT_0_DRIVE_OFFSET = 3

export const IMAX_RANGE_FULL = 0b00
export const IMAX_RANGE_3_4 = 0b01
export const IMAX_RANGE_2_4 = 0b10
export const IMAX_RANGE_1_4 = 0b11

export const DEFAULT = {
	DIRECTION: DIRECTION_OUTPUT,
	INTERRUPT: INTERRUPT_ENABLE,
	MODE: MODE_GPIO,
}

export const RESET_BUFFER = Uint8Array.from([ 0x00 ])

export const BYTE_LENGTH_ONE = 1

export const REGISTERS = {
	INPUT_PORT_0: 0x00,
	INPUT_PORT_1: 0x01,

	OUTPUT_PORT_0: 0x02,
	OUTPUT_PORT_1: 0x03,
	CONFIG_PORT_0: 0x04,
	CONFIG_PORT_1: 0x05,
	INTERRUPT_PORT_0: 0x06,
	INTERRUPT_PORT_1: 0x07,

	ID: 0x10,
	CONTROL: 0x11,
	LED_MODE_PORT_0: 0x12,
	LED_MODE_PORT_1: 0x13,

	DIM_0: 0x20,
	DIM_1: 0x21,
	DIM_2: 0x22,
	DIM_3: 0x23,
	DIM_4: 0x24,
	DIM_5: 0x25,
	DIM_6: 0x26,
	DIM_7: 0x27,
	DIM_8: 0x28,
	DIM_9: 0x29,
	DIM_10: 0x2a,
	DIM_11: 0x2b,
	DIM_12: 0x2c,
	DIM_13: 0x2d,
	DIM_14: 0x2e,
	DIM_15: 0x2f,

	SOFT_RESET: 0x7f
}

export const PORTS = [
	{
		INPUT: REGISTERS.INPUT_PORT_0,
		OUTPUT: REGISTERS.OUTPUT_PORT_0,
		DIRECTION: REGISTERS.CONFIG_PORT_0,
		INTERRUPT: REGISTERS.INTERRUPT_PORT_0,
		MODE: REGISTERS.LED_MODE_PORT_0
	},
	{
		INPUT: REGISTERS.INPUT_PORT_1,
		OUTPUT: REGISTERS.OUTPUT_PORT_1,
		DIRECTION: REGISTERS.CONFIG_PORT_1,
		INTERRUPT: REGISTERS.INTERRUPT_PORT_1,
		MODE: REGISTERS.LED_MODE_PORT_1
	}
]

export const BLOCKS = {
	PORTS_ALL: { OFFSET: REGISTERS.INPUT_PORT_0, LENGTH: 8 },
	PORTS: { OFFSET: REGISTERS.OUTPUT_PORT_0, LENGTH: 6 },
	INPUT: { OFFSET: REGISTERS.INPUT_PORT_0, LENGTH: 2 },
	OUTPUT: { OFFSET: REGISTERS.OUTPUT_PORT_0, LENGTH: 2 },
	DIRECTION: { OFFSET: REGISTERS.CONFIG_PORT_0, LENGTH: 2 },
	INTERRUPT: { OFFSET: REGISTERS.INTERRUPT_PORT_0, LENGTH: 2 },
	MODE: { OFFSET: REGISTERS.LED_MODE_PORT_0, LENGTH: 2 },
	PROFILE: { OFFSET: REGISTERS.ID, LENGTH: 4 },
	DIMMING_ALL: { OFFSET: REGISTERS.DIM_0, LENGTH: 16 }
}


export const DIM_REGISTER_FOR_PORT_PIN = [
	[
		REGISTERS.DIM_4, REGISTERS.DIM_5, REGISTERS.DIM_6, REGISTERS.DIM_7,
		REGISTERS.DIM_8, REGISTERS.DIM_9, REGISTERS.DIM_10, REGISTERS.DIM_11
	],
	[
		REGISTERS.DIM_0, REGISTERS.DIM_1, REGISTERS.DIM_2, REGISTERS.DIM_3,
		REGISTERS.DIM_12, REGISTERS.DIM_13, REGISTERS.DIM_14, REGISTERS.DIM_15
	]
]

export class Converter {
	static decodeBits(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const [ bits, ] = u8

		return [
			(bits & 0b0000_0001),
			(bits & 0b0000_0010) >> 1,
			(bits & 0b0000_0100) >> 2,
			(bits & 0b0000_1000) >> 3,
			(bits & 0b0001_0000) >> 4,
			(bits & 0b0010_0000) >> 5,
			(bits & 0b0100_0000) >> 6,
			(bits & 0b1000_0000) >> 7
		]
	}

	static encodeBits(bits, into = Uint8Array.from([ 0 ])) {
		into[0] = 0 |
			(bits[0] === HIGH ? 0b0000_0001 : 0) |
			(bits[1] === HIGH ? 0b0000_0010 : 0) |
			(bits[2] === HIGH ? 0b0000_0100 : 0) |
			(bits[3] === HIGH ? 0b0000_1000 : 0) |
			(bits[4] === HIGH ? 0b0001_0000 : 0) |
			(bits[5] === HIGH ? 0b0010_0000 : 0) |
			(bits[6] === HIGH ? 0b0100_0000 : 0) |
			(bits[7] === HIGH ? 0b1000_0000 : 0)

		return into.buffer
	}

	static decodeId(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		return u8[0]
	}

	static decodeControl(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const bits = u8[0]

		return {
			port0PushPull: ((bits >> PORT_0_DRIVE_OFFSET) & 0b1) === 0b1,
			iMaxRange: bits & 0b11
		}
	}

	static encodeControl({
		port0PushPull = false,
		iMaxRange = IMAX_RANGE_FULL
	}, into = Uint8Array.from([ 0x00 ])) {
		into[0] = (port0PushPull ? (1 << PORT_0_DRIVE_OFFSET) : 0) | (iMaxRange & 0b11)
		return into.buffer
	}

	static decodeMode(buffer) {
		return {
			mode: Converter.decodeBits(buffer)
		}
	}

	static decodeModes(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const mode0 = Converter.decodeMode(u8.subarray(0, 1))
		const mode1 = Converter.decodeMode(u8.subarray(1, 2))

		return [ ...mode0.mode, ...mode1.mode ]
	}

	static decodeProfile(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const id = Converter.decodeId(u8.subarray(0, 1))
		const control = Converter.decodeControl(u8.subarray(1, 2))
		const mode = Converter.decodeModes(u8.subarray(2, 4))

		return {
			...control,

			id,
			mode
		}
	}

	static decodeDimmings(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		return [
			u8[4], u8[5], u8[6], u8[7],
			u8[8], u8[9], u8[10], u8[11],
			u8[0], u8[1], u8[2], u8[3],
			u8[12], u8[13], u8[14], u8[15],
		]
	}

	static decodeInput(buffer) {
		const bitsArray = Converter.decodeBits(buffer)
		return { input: bitsArray.map(bit => bit === HIGH) }
	}

	static decodeInputs(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const input0 = Converter.decodeInput(u8.subarray(0, 1))
		const input1 = Converter.decodeInput(u8.subarray(1, 2))

		return [ ...input0.input, ...input1.input ]
	}

	static encodeOutput(output) {
		return Converter.encodeBits(output.map(o => o ? HIGH : LOW))
	}

	static decodeOutput(buffer) {
		const bitsArray = Converter.decodeBits(buffer)
		return { output: bitsArray.map(bit => bit === HIGH) }
	}

	static decodeOutputs(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const output0 = Converter.decodeOutput(u8.subarray(0, 1))
		const output1 = Converter.decodeOutput(u8.subarray(1, 2))

		return [ ...output0.output, ...output1.output ]
	}

	static decodeDirection(buffer) {
		const bitsArray = Converter.decodeBits(buffer)
		return { direction: bitsArray }
	}

	static decodeDirections(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const direction0 = Converter.decodeDirection(u8.subarray(0, 1))
		const direction1 = Converter.decodeDirection(u8.subarray(1, 2))

		return [ ...direction0.direction, ...direction1.direction ]
	}

	static encodeInterrupt(interrupt) {
		return Converter.encodeBits(interrupt.map(i => i ? INTERRUPT_ENABLE : INTERRUPT_DISABLE))
	}

	static decodeInterrupt(buffer) {
		const bitsArray = Converter.decodeBits(buffer)
		return { interrupt: bitsArray.map(bit => bit === INTERRUPT_ENABLE) }
	}

	static decodeInterrupts(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const interrupt0 = Converter.decodeInterrupt(u8.subarray(0, 1))
		const interrupt1 = Converter.decodeInterrupt(u8.subarray(1, 2))

		return [ ...interrupt0.interrupt, ...interrupt1.interrupt ]
	}

	static decodePorts(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const inputs = Converter.decodeInputs(u8.subarray(0, 2))
		const outputs = Converter.decodeOutputs(u8.subarray(2, 4))
		const directions = Converter.decodeDirections(u8.subarray(4, 6))
		const interrupts = Converter.decodeInterrupts(u8.subarray(6, 8))

		return {
			inputs,
			outputs,
			directions,
			interrupts
		}
	}
}

export class Common {
	static async getId(aBus) {
		const buffer = await aBus.readI2cBlock(REGISTERS.ID, BYTE_LENGTH_ONE)
		return Converter.decodeId(buffer)
	}

	static async reset(aBus) { return aBus.writeI2cBlock(REGISTERS.SOFT_RESET, RESET_BUFFER) }

	static async getControl(aBus) {
		const buffer = await aBus.readI2cBlock(REGISTERS.CONTROL, BYTE_LENGTH_ONE)
		return Converter.decodeControl(buffer)
	}

	static async setControl(aBus, control) {
		const buffer = Converter.encodeControl(control)
		return aBus.writeI2cBlock(REGISTERS.CONTROL, buffer)
	}

	static async getMode(aBus, port) {
		const buffer = await aBus.readI2cBlock(PORTS[port].MODE, BYTE_LENGTH_ONE)
		return Converter.decodeMode(buffer)
	}

	static async setMode(aBus, port, mode) {
		const buffer = Converter.encodeBits(mode)
		return aBus.writeI2cBlock(PORTS[port].MODE, buffer)
	}

	static async getInput(aBus, port) {
		const buffer = await aBus.readI2cBlock(PORTS[port].INPUT, BYTE_LENGTH_ONE)
		return Converter.decodeInput(buffer)
	}

	static async getOutput(aBus, port) {
		const buffer = await aBus.readI2cBlock(PORTS[port].OUTPUT, BYTE_LENGTH_ONE)
		return Converter.decodeOutput(buffer)
	}

	static async setOutput(aBus, port, output) {
		const buffer = Converter.encodeOutput(output)
		return aBus.writeI2cBlock(PORTS[port].OUTPUT, buffer)
	}

	static async getDirection(aBus, port) {
		const buffer = await aBus.readI2cBlock(PORTS[port].DIRECTION, BYTE_LENGTH_ONE)
		return Converter.decodeDirection(buffer)
	}

	static async setDirection(aBus, port, direction) {
		const buffer = Converter.encodeBits(direction)
		return aBus.writeI2cBlock(PORTS[port].DIRECTION, buffer)
	}

	static async getInterrupt(aBus, port) {
		const buffer = await aBus.readI2cBlock(PORTS[port].INTERRUPT, BYTE_LENGTH_ONE)
		return Converter.decodeInterrupt(buffer)
	}

	static async setInterrupt(aBus, port, interrupt) {
		const buffer = Converter.encodeInterrupt(interrupt)
		return aBus.writeI2cBlock(PORTS[port].INTERRUPT, buffer)
	}

	static async setDimming(aBus, port, pin, dim) {
		return aBus.writeI2cBlock(DIM_REGISTER_FOR_PORT_PIN[port][pin], Uint8Array.from([ dim ]))
	}

	// ---

	static async getProfile(aBus) {
		const buffer = await aBus.readI2cBlock(BLOCKS.PROFILE.OFFSET, BLOCKS.PROFILE.LENGTH)
		return Converter.decodeProfile(buffer)
	}

	// ---

	static async getModes(aBus) {
		const buffer = await aBus.readI2cBlock(BLOCKS.MODE.OFFSET, BLOCKS.MODE.LENGTH)
		return Converter.decodeModes(buffer)
	}

	static async getInputs(aBus) {
		const buffer = await aBus.readI2cBlock(BLOCKS.INPUT.OFFSET, BLOCKS.INPUT.LENGTH)
		return Converter.decodeInputs(buffer)
	}

	static async getOutputs(aBus) {
		const buffer = await aBus.readI2cBlock(BLOCKS.OUTPUT.OFFSET, BLOCKS.OUTPUT.LENGTH)
		return Converter.decodeOutputs(buffer)
	}

	static async getDirections(aBus) {
		const buffer = await aBus.readI2cBlock(BLOCKS.DIRECTION.OFFSET, BLOCKS.DIRECTION.LENGTH)
		return Converter.decodeDirections(buffer)
	}

	static async getInterrupts(aBus) {
		const buffer = await aBus.readI2cBlock(BLOCKS.INTERRUPT.OFFSET, BLOCKS.INTERRUPT.LENGTH)
		return Converter.decodeInterrupts(buffer)
	}

	// ---

	static async getPorts(aBus) {
		const buffer = await aBus.readI2cBlock(BLOCKS.PORTS_ALL.OFFSET, BLOCKS.PORTS_ALL.LENGTH)
		return Converter.decodePorts(buffer)
	}
}

export class AW9523 {
	#aBus
	static from(aBus) { return new AW9523(aBus) }
	constructor(aBus) { this.#aBus = aBus }

	async getId() { return Common.getId(this.#aBus) }
	async reset() { return Common.reset(this.#aBus) }

	async getProfile() { return Common.getProfile(this.#aBus) }

	async getControl() { return Common.getControl(this.#aBus) }
	async setControl(control) { return Common.setControl(this.#aBus, control) }

	async getMode(port) { return Common.getMode(this.#aBus, port) }
	async getModes() { return Common.getModes(this.#aBus) }
	async setMode(port, mode) { return Common.setMode(this.#aBus, port, mode) }

	async getInput(port) { return Common.getInput(this.#aBus, port) }
	async getInputs() { return Common.getInputs(this.#aBus) }

	async getOutput(port) { return Common.getOutput(this.#aBus, port) }
	async getOutputs() { return Common.getOutputs(this.#aBus) }
	async setOutput(port, output) { return Common.setOutput(this.#aBus, port, output) }

	async getDirection(port) { return Common.getDirection(this.#aBus, port) }
	async getDirections() { return Common.getDirections(this.#aBus) }
	async setDirection(port, direction) { return Common.setDirection(this.#aBus, port, direction)}

	async getInterrupt(port) { return Common.getInterrupt(this.#aBus, port) }
	async getInterrupts() { return Common.getInterrupts(this.#aBus) }
	async setInterrupt(port, interrupt) { return Common.setInterrupt(this.#aBus, port, interrupt) }

	async getPorts() { return Common.getPorts(this.#aBus) }
	// async setPorts() {}

	async setDimming(port, pin, dim) { return Common.setDimming(this.#aBus, port, pin, dim) }
	// async setDimmingIdx(dimIdx, dim) {}
	// async setDimmings(dims) { return Common.setDimmings(this.#aBus, dims)}
}
