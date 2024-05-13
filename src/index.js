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
		const bitsArray = await Common._getPortGeneric(aBus, port, REGISTERS.INTERRUPT_PORT_0, REGISTERS.INTERRUPT_PORT_0)
		return { interrupt: bitsArray.map(bit => bit === ENABLE) }
	}

}

export class AW9523 {
	#aBus
	static from(aBus) { return new AW9523(aBus) }
	constructor(aBus) { this.#aBus = aBus }

	async getId() { return Common.getId(this.#aBus) }

	async reset() { return Common.reset(this.#aBus) }

	async getPortInput(port) { return Common.getInput(this.#aBus, port) }

	async getPortOutput(port) { return Common.getOutput(this.#aBus, port) }

	async setPortOutput(port) {}

	async getPortDirection(port) { return Common.getDirection(this.#aBus, port) }

	async setPortDirection(port) {}

	async getPortInterrupt(port) { return Common.getInterrupt(this.#aBus, port) }

	async setPortInterrupt(port) {}

	async getProfile() { return Common.getProfile(this.#aBus) }

	async setProfile(profile) {}

	async getDimming(port, pin) {}

	async setDimming(port, pin, dim) {}

	async getAllDimming() {}

	async setAllDimming(dims) {}
}
