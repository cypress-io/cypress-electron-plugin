console.log('loading', __filename)
console.log('CWD', process.cwd())

const { app, BrowserWindow } = require('electron')
const path = require('path')
// const arg = require('arg')
// const args = arg(
//   {
//     '--cypress-runner-url': String
//   },
//   { permissive: true }
// ) // allow unknown options

let autWindow

function createWindow () {
  // this window will be the "top" or first window
  // where Cypress will show its contents
  const win = new BrowserWindow({
    width: 800,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'cypress_preload.js'),
      nativeWindowOpen: true,
      nodeIntegration: true,
      nodeIntegrationInSubFrames: true
    }
  })

  win.webContents.openDevTools()

  // if (args['--cypress-runner-url']) {
  //   // Cypress will load its runner UI
  //   console.log('Cypress will control loading')
  // }
  win.loadFile('cypress.html')

  win.webContents.on('did-finish-load', () => {
    // this is basically the command
    // cy.createElectronBrowserWindow(...)
    // which would likely take either browser window options directly
    // or a path to a script file which we would then invoke
    //
    // signature:
    // options
    // pathToFile, options
    // pathToLocalHtml, options
    // pathToRemoteHtml, options
    //
    // example using pathToLocalHtml
    // win.webContents.send('createAutBrowserWindow', 'aut.html')
    //
    // example using pathToFile
    // setTimeout(() => {
    //   // create browser window using user's regular main browser factory
    //   // yet, this window will be directly controlled from our window
    //   const options = {
    //     type: 'pathToFile',
    //     file: './main_browser_window.js',
    //     url: './aut.html'
    //   }
    //   win.webContents.send('createAutBrowserWindow', options)
    // }, 2000)
  })

  const createAutWindowByType = (type, file, options) => {
    console.log('createAutWindowByType')
    if (type) {
      console.log('type: %s', type)
    }
    if (file) {
      console.log('file: %s', file)
    }

    let win

    if (type === 'pathToLocalHtml') {
      win = new BrowserWindow({
        webContents: options.webContents
      })
    }

    if (type === 'pathToFile') {
      console.log('require browser window factory', file)
      // console.log('current require', require)
      console.log('current require.resolve paths', require.resolve.paths(''))
      // console.log('CWD', process.cwd())
      if (!path.isAbsolute(file)) {
        file = path.resolve(process.cwd(), file)
        console.log('loading resolved file', file)
      }
      const BrowserWindowFactory = require(file)

      console.log('calling browser window factory from file %s', file)
      win = BrowserWindowFactory({
        webContents: options.webContents
      })
    }

    return win
  }

  win.webContents.on(
    'new-window',
    (
      event,
      urlStr,
      frameName,
      disposition,
      options,
      additionalFeatures,
      referrer
    ) => {
      console.log('cypress.js webContents on new-window')

      // if we already have a window then destroy it
      if (autWindow && !autWindow.isDestroyed()) {
        console.log('destroying aut window')
        autWindow.destroy()
      }

      const { type, file, url } = JSON.parse(frameName)
      console.log({
        type,
        file,
        url
      })

      // the "trick"
      // after "dummy" window finishes loading
      // we load the real content vis "autWindow.loadFile"
      // because we create new window and pass existing webContents
      // our original "opener" of the webContents remains
      // in sync control of the new window still

      // either would be controlled via cy.visit()
      // or maybe as an option to cy.createElectronBrowserWindow(...)
      autWindow = createAutWindowByType(type, file, options)

      autWindow.on('close', () => {
        autWindow = null
      })

      event.preventDefault()
      event.newGuest = autWindow

      if (url) {
        if (url.startsWith('http')) {
          console.log('loading url', url)
          autWindow.loadURL(url)
        } else {
          console.log('loading file', url)
          autWindow.loadFile(url)
        }
      } else {
        console.log('aut window created, not loading url yet')
      }
    }
  )
}

app.on('ready', createWindow)
