
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
	PORTS: {},
	PROFILE: {},
	DIMMING_ALL: {}
}

export class Common {
	static async reset(aBus) { return aBus.writeI2cBlock(REGISTERS.SOFT_RESET, Uint8Array.from([ 0 ])) }
}

export class AW9523 {
	#aBus
	static from(aBus) { return new AW9523(aBus) }
	constructor(aBus) { this.#aBus = aBus }

	async reset() { return Common.reset(this.#aBus) }

	async getPorts() {}

	async setPorts(ports) {}

	async getPortInput(port) {}

	async getPortOutput(port) {}

	async setPortOutput(port) {}

	async getPortDirection(port) {}

	async setPortDirection(port) {}

	async getPortInterrupt(port) {}

	async setPortInterrupt(port) {}

	async getProfile() {}

	async setProfile(profile) {}

	async getDimming(port, pin) {}

	async setDimming(port, pin, dim) {}

	async getAllDimming() {}

	async setAllDimming(dims) {}
}
