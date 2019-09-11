const { ipcRenderer } = require('electron')

const onCreateAutBrowserWindow = (event, options) => {
  console.log('onCreateAutBrowserWindow')
  console.log('event', event)
  console.log('options', options)
  window.child = window.open('', JSON.stringify(options))
}

ipcRenderer.on('createAutBrowserWindow', onCreateAutBrowserWindow)
