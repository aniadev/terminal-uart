new Vue({
	el: '#app',
	data() {
		return {
			isAutoScroll: true,
			isShowTimestamp: true,
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
			baudrate: 115200,
			port: null,
			reader: null,
			onReadingSerial: false,
			outputPanel: null,

			allRecordData: [],
			currentRecordData: {
				data: [
					{
						id: 1,
						label: 'Tk',
						value: '30.22',
					},
					{
						id: 2,
						label: 'To',
						value: '31.22',
					},
					{
						id: 3,
						label: 'Tgn',
						value: '33.22',
					},
					{
						id: 4,
						label: 'Tbl1',
						value: '34.22',
					},
					{
						id: 5,
						label: 'Tbl2',
						value: '35.22',
					},
				],
				timestamp: Date.now(),
			},
			chart: null,
			chartLabels: [],
			chartData: [
				{
					label: 'T1',
					data: [],
					borderWidth: 1,
					borderColor: '#e74c3c',
				},
				{
					label: 'T2',
					data: [],
					borderWidth: 1,
					borderColor: '#3498db',
				},
				{
					label: 'T3',
					data: [],
					borderWidth: 1,
					borderColor: '#16a085',
				},
				{
					label: 'T4',
					data: [],
					borderWidth: 1,
					borderColor: '#34495e',
				},
				{
					label: 'T5',
					data: [],
					borderWidth: 1,
					borderColor: '#7f8c8d',
				},
			],
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
				setTimeout(() => {
					this.onReadingSerial = true
					console.log('START_READING_SERIAL')
					this.rxObjData = {}
					this.rxData = ''
				}, 2000)

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
						if (this.onReadingSerial) {
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
			this.onReadingSerial = false
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
			this.mapRecordData()
			this.mapChartData()
		},
		scrollToBottom() {
			this.outputPanel.scrollTop = this.outputPanel.scrollHeight
		},
		mapRecordData() {
			const arrData = this.rxData.trimEnd().split(',')
			this.currentRecordData.data[0].value = arrData[0] ? arrData[0] : '-'
			this.currentRecordData.data[1].value = arrData[1] ? arrData[1] : '-'
			this.currentRecordData.data[2].value = arrData[2] ? arrData[2] : '-'
			this.currentRecordData.data[3].value = arrData[3] ? arrData[3] : '-'
			this.currentRecordData.data[4].value = arrData[4] ? arrData[4] : '-'
			this.currentRecordData.timestamp = new Date().toString()

			this.allRecordData.push(this.currentRecordData)
		},
		mapChartData() {
			const arrData = this.rxData.trimEnd().split(',')
			const timestamp = new Date().toLocaleTimeString('vi-VN')
			this.addData(timestamp, arrData)
		},
		addData(label, arrData) {
			this.chart.data.labels.push(label);
			this.chart.data.datasets.forEach((dataset, index) => {
				dataset.data.push(arrData[index] || null);
			});
			this.chart.update();
		}
		
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

		const ctx = document.getElementById('myChart')
		this.chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: this.chartLabels,
				datasets: this.chartData
			},
			options: {
				scales: {
					y: {
						beginAtZero: true,
					},
				},
			},
		})
		console.log(this.chart)
	},
	destroy() {},
})
