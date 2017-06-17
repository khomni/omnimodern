// window.addEventListener('popstate', e => {
//   let triggerTab = document.querySelector('.tab[href="'+e.state.href+'"]')
//   if(!triggerTab) return true;

//   triggerTab.dispatchEvent(new Event('show.tab', {bubbles:true, cancelable:true}))
//   e.preventDefault();
//   return false;
// });


document.addEventListener('show.tab', function(e) {
  let source = e.target;
  let target = document.getElementById(source.dataset.target) || document.querySelector(source.dataset.target);

  if(!target) return false;

  var href = source.getAttribute('href');

  var allTabs = Array.prototype.slice.call(source.parentNode.childNodes)

  target.addEventListener('shown.pane', function tabShown(e) {
    
    allTabs.forEach(node => {
      if(node != source) return node.classList.remove('active');
      return node.classList.add('active');
    })

    source.dispatchEvent(new Event('shown.tab', {bubbles:true, cancelable:true}))
    target.removeEventListener('shown.tab', tabShown)
  })

  
  if(!href || (source.dataset.loaded && !('reload' in source.dataset))) {
    return target.dispatchEvent(new Event('show.pane', {bubbles:true, cancelable:true}))
  }
  
  target.setAttribute('href', href);
  target.dispatchEvent(new Event('load.pane', {bubbles:true, cancelable:true}))

  if(!target.setReload) {
    target.setReload = true;
    target.addEventListener('reload', function reloadTab(e){
      target.dispatchEvent(new Event('load.pane',{bubbles:true, cancelable:true}))
    });
  }

  target.addEventListener('loaded.pane', function tabLoaded(e){
    // exampine the tab's XHR response
    let xhr = e.detail;
    // remove this listener after it fires
    target.removeEventListener('loaded.pane', tabLoaded)
    
    source.classList.remove('error','obscured');
    if(xhr.status >= 500 && xhr.status < 600) return source.classList.add('error');
    if(xhr.status >= 400 && xhr.status < 500) return source.classList.add('obscured');

    target.dispatchEvent(new Event('show.pane', {bubbles:true, cancelable:true}))
  })

    // target.classList.add('active');
});

document.addEventListener('load.pane', function(e){
  let thisPane = e.target;
  let href = thisPane.getAttribute('href');
  if(!href) return false;

  Ajax.fetch({url:href, method:'get', headers:{'Accept': 'text/html', 'X-Tab-Content': true}})
  .then(xhr => {
    // send the xhr resonse to the tab
    thisPane.dispatchEvent(new CustomEvent('loaded.pane', {detail: xhr, bubbles:true, cancelable:true}));

    let html = xhr.responseText

    if(xhr.getResponseHeader('X-Modal')) return Modal.methods.createModal(html);

    thisPane.classList.remove('error');
    thisPane.innerHTML = html;
  })
  .catch(err => {
    thisPane.classList.add('error')
  })

})

document.addEventListener('show.pane', function(e){
  let thisPane = e.target;

  var allPanes = Array.prototype.slice.call(thisPane.parentNode.childNodes)

  allPanes.forEach(node => {
    if(node != thisPane) return node.classList.remove('active');
    return node.classList.add('active');
  });
  
  thisPane.dispatchEvent(new Event('shown.pane'))
  document.dispatchEvent(new Event('scroll'))

});
