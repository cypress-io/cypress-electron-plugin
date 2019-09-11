Cypress.Commands.add('electronVisitUrl', (windowFactoryFile, url) => {
  console.log({ windowFactoryFile, url })

  const options = {
    type: 'pathToFile',
    file: windowFactoryFile,
    url
  }

  return new Promise(resolve => {
    const mw = window.child = window.top.open('', JSON.stringify(options), true)

    // TODO resolve when mw.document is valid
    // for now simply wait
    setTimeout(() => {
      cy.state('document', mw.document)
      cy.state('window', mw)
      resolve()
    }, 500)
  })
})
