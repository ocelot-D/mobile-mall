export function debounce(fn, wait = 300) {
  let timer = null

  function wrapped(...args) {

    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
    }, wait)
  }

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  return wrapped
}

export function throttle(fn, interval = 16) {
  let last = 0
  let timer = null

  let pendingArgs = null
  let pendingThis = null

  function wrapped(...args) {
    const now = Date.now()
    const remain = interval - (now - last)

    if (remain <= 0) {

      last = now
      fn.apply(this, args)
    } else {

      pendingArgs = args
      pendingThis = this
      if (!timer) {
        timer = setTimeout(() => {
          timer = null
          last = Date.now()
          fn.apply(pendingThis, pendingArgs)
          pendingArgs = null
          pendingThis = null
        }, remain)
      }
    }
  }

  wrapped.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    pendingArgs = null
    pendingThis = null
  }

  return wrapped
}
