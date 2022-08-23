#!/usr/bin/env node

const fs = require('fs')

const readdir = fs.readdirSync
const writeFile = (folder, text) => {
	return fs.writeFileSync(folder, text, (error) => {
		error && console.log(error)
	})
}

const exportableExtensions = ['.tsx', '.ts', '.jsx', '.js']
const regexExtensionsString = `(\\${exportableExtensions.join('|\\')})$`
const ignoreIndexes = new RegExp(`(indexer|index)${regexExtensionsString}`, 'g')
const regexExtensions = new RegExp(`${regexExtensionsString}`, 'g')
console.log(regexExtensionsString)
const arguments = process.argv.slice(2)
const recursiveFlagIndex = arguments.indexOf('-r')
const isRecursive = recursiveFlagIndex > -1
let folders = []

function isExportable(name) {
	if (name.match(/\./g).length > 1) return false
	if (!name.match(regexExtensions)) return false
	return true
}

function isFolder(name) {
	if (name.match(/\./g)) return false
	return true
}

function makeIndex(folder, recursive = false) {
	const collator = new Intl.Collator(undefined, {
		numeric: true,
		sensitivity: 'base',
	})

	let isTypeScript = false
	let filesText = ''
	let folderText = ''
	let text = ''
	let itemNames = readdir(folder)

	itemNames = itemNames
		.sort(collator.compare)
		.filter((name) => !name.match(ignoreIndexes, ''))

	for (let i = 0; i < itemNames.length; i++) {
		const name = itemNames[i]

		const path = `${folder}/${name}`
		if (isExportable(name)) {
			const nameNoExtension = name.replace(regexExtensions, '')
			filesText += `export { ${nameNoExtension} } from './${nameNoExtension}'\n`

			if (!!name.match(/(\.tsx|\.ts)$/m)) {
				isTypeScript = true
			}
		} else if (isFolder(name)) {
			folderText += `export * from './${name}'\n`
			if (recursive) {
				makeIndex(path, true)
			}
		}
	}

	if (!filesText || !folderText) {
		text = filesText + folderText
	} else {
		text = `${filesText}\n${folderText}`
	}

	if (!text) return

	if (isTypeScript) {
		writeFile(`${folder}/index.ts`, text)
	} else {
		writeFile(`${folder}/index.js`, text)
	}
}

if (isRecursive) {
	arguments.splice(recursiveFlagIndex, 1)
}

folders = arguments

for (let i = 0; i < folders.length; i++) {
	folder = folders[i]
	if (fs.existsSync(folder)) {
		makeIndex(folder, isRecursive)
	} else {
		console.log(`"${folder}" path does not exist`)
	}
}
console.log('Done📁')