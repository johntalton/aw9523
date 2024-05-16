export const DEFAULT_ADDRESS = 0x58

export const DEVICE_ID = 0x23

export const HIGH = 1
export const LOW = 0

export const OUTPUT = LOW
export const INPUT = HIGH

export const ENABLE = LOW
export const DISABLE = HIGH

export const MODE_GPIO = HIGH
export const MODE_LED = LOW

export const PORT_0_DRIVE_OFFSET = 3

export const IMAX_RANGE_FULL = 0b00
export const IMAX_RANGE_3_4 = 0b01
export const IMAX_RANGE_2_4 = 0b10
export const IMAX_RANGE_1_4 = 0b11



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

export const BLOCKS = {
	PORTS: { OFFSET: REGISTERS.INPUT_PORT_0, LENGTH: 8 },
	PROFILE: { OFFSET: REGISTERS.ID, LENGTH: 4 },
	DIMMING_ALL: { OFFSET: REGISTERS.DIM_0, LENGTH: 16}
}

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

	static decodeProfile(buffer) {
		const u8 = ArrayBuffer.isView(buffer) ?
			new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) :
			new Uint8Array(buffer)

		const id = Converter.decodeId(u8.subarray(0, 1))
		const control = Converter.decodeControl(u8.subarray(1, 2))
		const mode0 = Converter.decodeMode(u8.subarray(2, 3))
		const mode1 = Converter.decodeMode(u8.subarray(3, 4))

		return {
			...control,

			id,
			port0Mode: mode0.mode,
			port1Mode: mode1.mode
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
}

export class Common {
	static async getId(aBus) {
		const buffer = await aBus.readI2cBlock(REGISTERS.ID, BYTE_LENGTH_ONE)
		return Converter.decodeId(buffer)
	}

	static async reset(aBus) { return aBus.writeI2cBlock(REGISTERS.SOFT_RESET, Uint8Array.from([ 0x00 ])) }

	static async getProfile(aBus) {
		const buffer = await aBus.readI2cBlock(BLOCKS.PROFILE.OFFSET, BLOCKS.PROFILE.LENGTH)
		return Converter.decodeProfile(buffer)
	}

	static async setControl(aBus, control) {
		const buffer = Converter.encodeControl(control)
		return aBus.writeI2cBlock(REGISTERS.CONTROL, buffer)
	}



	static async _getPortGeneric(aBus, port, register0, register1) {
		const buffer = await aBus.readI2cBlock(port === 0 ? register0 : register1, BYTE_LENGTH_ONE)
		return Converter.decodeBits(buffer)
	}

	static async getInput(aBus, port) {
		const bitsArray = await Common._getPortGeneric(aBus, port, REGISTERS.INPUT_PORT_0, REGISTERS.INPUT_PORT_1)
		return { input: bitsArray.map(bit => bit === HIGH) }
	}

	static async getOutput(aBus, port) {
		const bitsArray = await Common._getPortGeneric(aBus, port, REGISTERS.OUTPUT_PORT_0, REGISTERS.OUTPUT_PORT_1)
		return { output: bitsArray.map(bit => bit === HIGH) }
	}

	static async getDirection(aBus, port) {
		const bitsArray = await Common._getPortGeneric(aBus, port, REGISTERS.CONFIG_PORT_0, REGISTERS.CONFIG_PORT_1)
		return { direction: bitsArray }
	}

	static async getInterrupt(aBus, port) {
		const bitsArray = await Common._getPortGeneric(aBus, port, REGISTERS.INTERRUPT_PORT_0, REGISTERS.INTERRUPT_PORT_1)
		return { interrupt: bitsArray.map(bit => bit === ENABLE) }
	}


	static async setOutput(aBus, port, output) {
		const buffer = Converter.encodeBits(output.map(o => o ? HIGH : LOW))
		return aBus.writeI2cBlock(port === 0 ? REGISTERS.OUTPUT_PORT_0 : REGISTERS.OUTPUT_PORT_1, buffer)
	}

	static async setDirection(aBus, port, direction) {
		const buffer = Converter.encodeBits(direction)
		return aBus.writeI2cBlock(port === 0 ? REGISTERS.CONFIG_PORT_0 : REGISTERS.CONFIG_PORT_1, buffer)
	}

	static async setInterrupt(aBus, port, interrupt) {
		const buffer = Uint8Array.from([ 0x00 ]) // Converter.encodeBits(interrupt.map(i => i ? ENABLE : DISABLE))
		return aBus.writeI2cBlock(port === 0 ? REGISTERS.INTERRUPT_PORT_0 : REGISTERS.INTERRUPT_PORT_1, buffer)
	}

	static async setMode(aBus, port, mode) {
		const buffer = Converter.encodeBits(mode)
		return aBus.writeI2cBlock(port === 0 ? REGISTERS.LED_MODE_PORT_0 : REGISTERS.LED_MODE_PORT_1, buffer)
	}

	static async getDimmings(aBus) {
		const buffer = await aBus.readI2cBlock(BLOCKS.DIMMING_ALL.OFFSET, BLOCKS.DIMMING_ALL.LENGTH)
		return Converter.decodeDimmings(buffer)
	}
}

export class AW9523 {
	#aBus
	static from(aBus) { return new AW9523(aBus) }
	constructor(aBus) { this.#aBus = aBus }

	async getId() { return Common.getId(this.#aBus) }

	async reset() { return Common.reset(this.#aBus) }

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

	async getProfile() { return Common.getProfile(this.#aBus) }

	async setMode(port, mode) { return Common.setMode(this.#aBus, port, mode) }

	async setControl(control) { return Common.setControl(this.#aBus, control) }

	// async setProfile(profile) {}

	// async getDimming(port, pin) {}

	// async setDimming(port, pin, dim) {}

	async getDimmings() { return Common.getDimmings(this.#aBus) }

	async setDimmings(dims) { return Common.setDimmings(this.#aBus, dims)}
}
