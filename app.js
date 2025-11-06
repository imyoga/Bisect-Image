const fileInput = document.getElementById('fileInput')
const uploadArea = document.getElementById('uploadArea')
const uploadLabel = document.getElementById('uploadLabel')
const fileCount = document.getElementById('fileCount')
const thumbnailsContainer = document.getElementById('thumbnails')
const splitBtn = document.getElementById('splitBtn')
const downloadBtn = document.getElementById('downloadBtn')
const progressBar = document.getElementById('progressBar')
const progressFill = document.getElementById('progressFill')
const progressText = document.getElementById('progressText')

let images = []
let splitImages = []
let fileNames = []

// Drag and Drop functionality
uploadArea.addEventListener('dragover', (e) => {
	e.preventDefault()
	uploadArea.classList.add('dragover')
})

uploadArea.addEventListener('dragleave', () => {
	uploadArea.classList.remove('dragover')
})

uploadArea.addEventListener('drop', (e) => {
	e.preventDefault()
	uploadArea.classList.remove('dragover')
	
	const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
	if (files.length > 0) {
		fileInput.files = e.dataTransfer.files
		handleFiles(files)
	}
})

// File input change event
fileInput.addEventListener('change', (e) => {
	const files = Array.from(e.target.files)
	handleFiles(files)
})

// Handle file processing
function handleFiles(files) {
	images = []
	splitImages = []
	fileNames = []
	thumbnailsContainer.innerHTML = ''
	splitBtn.disabled = false
	downloadBtn.disabled = true
	progressBar.classList.remove('active')

	// Update file count
	fileCount.textContent = `${files.length} image${files.length !== 1 ? 's' : ''} selected`
	fileCount.style.display = 'block'

	files.forEach((file, index) => {
		fileNames.push(file.name)
		const reader = new FileReader()
		reader.onload = (e) => {
			const img = new Image()
			img.src = e.target.result
			img.onload = () => {
				images.push(img)
				displayOriginalThumbnail(img, file.name, index)
			}
		}
		reader.readAsDataURL(file)
	})
}

// Display original image thumbnails
function displayOriginalThumbnail(img, fileName, index) {
	const thumbnailContainer = document.createElement('div')
	thumbnailContainer.classList.add('thumbnail-container')

	const thumbnailRow = document.createElement('div')
	thumbnailRow.classList.add('thumbnail-row')

	const thumbnail = img.cloneNode()
	thumbnail.classList.add('thumbnail')
	thumbnailRow.appendChild(thumbnail)

	thumbnailContainer.appendChild(thumbnailRow)

	const imageName = document.createElement('div')
	imageName.classList.add('image-name')
	imageName.textContent = fileName || `Image ${index + 1}`
	thumbnailContainer.appendChild(imageName)

	thumbnailsContainer.appendChild(thumbnailContainer)
}

// Split button click event
splitBtn.addEventListener('click', async () => {
	splitImages = []
	thumbnailsContainer.innerHTML = ''
	
	// Show progress bar
	progressBar.classList.add('active')
	progressFill.style.width = '0%'
	progressText.textContent = 'Splitting images...'

	const totalImages = images.length

	for (let index = 0; index < totalImages; index++) {
		const img = images[index]
		
		// Update progress
		const progress = ((index + 1) / totalImages) * 100
		progressFill.style.width = `${progress}%`
		progressText.textContent = `Processing ${index + 1} of ${totalImages}...`

		const canvas = document.createElement('canvas')
		const ctx = canvas.getContext('2d')
		const halfWidth = img.width / 2

		canvas.width = halfWidth
		canvas.height = img.height

		// Left half
		ctx.drawImage(img, 0, 0, halfWidth, img.height, 0, 0, halfWidth, img.height)
		splitImages.push(canvas.toDataURL())

		// Right half
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.drawImage(img, halfWidth, 0, halfWidth, img.height, 0, 0, halfWidth, img.height)
		splitImages.push(canvas.toDataURL())

		// Create thumbnails for split images
		displaySplitThumbnails(splitImages.slice(-2), fileNames[index] || `Image ${index + 1}`, index)

		// Small delay for UI responsiveness
		await delay(50)
	}

	// Complete progress
	progressFill.style.width = '100%'
	progressText.textContent = 'Complete!'
	
	// Hide progress bar after a short delay
	setTimeout(() => {
		progressBar.classList.remove('active')
	}, 1500)

	// Enable download button
	downloadBtn.disabled = false
})

// Display split image thumbnails
function displaySplitThumbnails(splitPair, fileName, index) {
	const thumbnailContainer = document.createElement('div')
	thumbnailContainer.classList.add('thumbnail-container')

	const thumbnailRow = document.createElement('div')
	thumbnailRow.classList.add('thumbnail-row')

	// Left thumbnail
	const leftThumbnail = new Image()
	leftThumbnail.src = splitPair[0]
	leftThumbnail.classList.add('thumbnail')
	thumbnailRow.appendChild(leftThumbnail)

	// Divider
	const divider = document.createElement('div')
	divider.classList.add('divider')
	thumbnailRow.appendChild(divider)

	// Right thumbnail
	const rightThumbnail = new Image()
	rightThumbnail.src = splitPair[1]
	rightThumbnail.classList.add('thumbnail')
	thumbnailRow.appendChild(rightThumbnail)

	thumbnailContainer.appendChild(thumbnailRow)

	const imageName = document.createElement('div')
	imageName.classList.add('image-name')
	imageName.textContent = `${fileName} (Split)`
	thumbnailContainer.appendChild(imageName)

	thumbnailsContainer.appendChild(thumbnailContainer)
}

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Download button click event
downloadBtn.addEventListener('click', async () => {
	const imagesPerGroup = 2
	let groupIndex = 1
	let imageIndexInGroup = 1
	
	for (const [index, item] of splitImages.entries()) {
		const link = document.createElement('a')
		link.href = item

		const mimeType = item.split(';')[0].split(':')[1]
		const fileExtension = mimeType.split('/')[1]

		link.download = `image_${groupIndex}-${imageIndexInGroup}.${fileExtension}`

		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		imageIndexInGroup++

		if (imageIndexInGroup > imagesPerGroup) {
			imageIndexInGroup = 1
			groupIndex++
		}

		await delay(110)
	}
});