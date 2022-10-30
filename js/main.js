new Vue({
	el: '#app',
	data() {
		return {
			isAutoScroll: true,
			isShowTimestamp: false,
			// isConnected: false,
			rxData: '',
			txData: '',
			rxObjData: {},
			rawOutputData: '',
			newLineOptions: [
				{
					label: 'No line ending',
					value: 'NO_LINE_ENDING',
				},
				{
					label: 'Newline',
					value: 'NEW_LINE',
				},
				{
					label: 'Carriage return',
					value: 'CARRIAGE_RETURN',
				},
				{
					label: 'Both NL & CR',
					value: 'BOTH_NL_AND_CR',
				},
			],
			newLineSelected: 'NO_LINE_ENDING',
			baudrateOptions: [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200],
			baudrate: 9600,
			port: null,
			reader: null,
			isReadingSerial: false,
			outputPanel: null,
		}
	},
	methods: {
		async handleConnect() {
			if (!this.isConnected) {
				await this.connectSerial()
			} else {
				await this.disconnectSerial()
			}
		},
		clearOutput() {
			this.rawOutputData = ''
		},
		async connectSerial() {
			try {
				console.log('connect')
				const filter = {usbVendorId: 0x2341}
				this.port = await navigator.serial.requestPort({filters: [filter]})
				await this.port.open({baudRate: this.baudrate})

				this.reader = this.port.readable.getReader()
				try {
					while (true) {
						const {value, done} = await this.reader.read()
						if (done) {
							// |reader| has been canceled.
							console.log('reader break')
							break
						}
						dnc = new TextDecoder('utf-8')
						str = dnc.decode(value)
						this.rxData += str
						if (str.includes('\n')) {
							this.rxObjData = {
								timestamp: Date.now(),
								value: this.rxData,
							}
							this.onReadline()
							this.rxData = ''
						}
					}
				} catch (error) {
					// Handle |error|…
				} finally {
					console.log('reader releaseLock')
					this.reader.releaseLock()
				}
			} catch (error) {
				console.log(error)
				this.rxData += error + '\r\n'
			}
		},
		async disconnectSerial() {
			this.reader.releaseLock()
			await this.port.close()
			this.port = null
		},
		onReadline() {
			if (this.isShowTimestamp) {
				this.rawOutputData += `${new Date(this.rxObjData.timestamp).toLocaleTimeString(
					'vi-VN'
				)} => ${this.rxObjData.value}`
			} else {
				this.rawOutputData += this.rxData
			}
			if (this.isAutoScroll) {
				this.scrollToBottom()
			}
		},
		scrollToBottom() {
			this.outputPanel.scrollTop = this.outputPanel.scrollHeight
		},
	},
	computed: {
		portInfo() {
			return this.port?.getInfo() || null
		},
		isConnected() {
			return this.portInfo?.usbVendorId ? true : false
		},
		portReadable() {
			return this.port?.readable || null
		},
		outputData() {
			return this.rawOutputData
		},
	},
	mounted() {
		this.outputPanel = document.getElementById('output-panel')
		this.scrollToBottom()
	},
	destroy() {},
})
