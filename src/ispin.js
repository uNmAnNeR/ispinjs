export default
class ISpin {
  constructor (el, opts) {
    this.el = el;
    this.options = {};

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
    this._onMouseLeave = this._onMouseLeave.bind(this);
    this._onWheel = this._onWheel.bind(this);

    this.build();
    this.update(opts);
  }

  build () {
    // wrap element
    this._wrapper = document.createElement('div');
    this.el.parentNode.appendChild(this._wrapper);
    this._wrapper.appendChild(this.el);

    // add buttons
    this._buttons = {
      inc: document.createElement('button'),
      dec: document.createElement('button')
    };

    // listen to events
    Object.keys(this._buttons).forEach(k => {
      const b = this._buttons[k];
      this._wrapper.appendChild(b);
      b.setAttribute('type', 'button');
      b.addEventListener('mousedown', this._onMouseDown);
      b.addEventListener('mouseup', this._onMouseUp);
      b.addEventListener('mouseleave', this._onMouseLeave);
    });
    this.el.addEventListener('keydown', this._onKeyDown);
    this.el.addEventListener('wheel', this._onWheel);
  }

  update (opts) {
    opts = {
      ...ISpin.DEFAULTS,
      ...this.options,
      ...opts
    };

    // update wrapper class
    if (opts.wrapperClass !== this.options.wrapperClass) {
      if (this.options.wrapperClass) this._wrapper.classList.remove(this.options.wrapperClass);
      if (opts.wrapperClass) this._wrapper.classList.add(opts.wrapperClass);
    }

    if (opts.buttonsClass !== this.options.buttonsClass) {
      if (this.options.buttonsClass) {
        Object.keys(this._buttons).forEach(k => {
          this._buttons[k].classList.remove(this.options.buttonsClass);
          this._buttons[k].classList.remove(this.options.buttonsClass + '-' + k);
        });
      }
      if (opts.buttonsClass) {
        Object.keys(this._buttons).forEach(k => {
          this._buttons[k].classList.add(opts.buttonsClass);
          this._buttons[k].classList.add(opts.buttonsClass + '-' + k);
        });
      }
    }

    this.disabled = opts.disabled;

    Object.assign(this.options, opts);
  }

  destroy () {
    this.el.parentNode.replaceChild(this.el, this._wrapper);
    delete this.el;
    delete this._wrapper;
    delete this._buttons;
  }

  _onKeyDown (e) {
    switch (e.keyCode) {
      case 38: // arrow up
        return this.spin(this.options.step);
      case 40: // arrow down
        return this.spin(-this.options.step);
      case 33: // page up
        return this.spin(this.options.pageStep);
      case 34: // page down
        return this.spin(-this.options.pageStep);
    }
  }

  _onMouseDown (e) {
    e.preventDefault();

    const direction = e.currentTarget === this._buttons.inc ? 1 : -1;
    this.spin(direction * this.options.step);
    this.el.focus();

    this._startSpinning(direction);
  }

  _onMouseUp () {
    this._stopSpinning();
  }

  _onMouseLeave () {
    this._stopSpinning();
  }

  _startSpinning (direction) {
    this._stopSpinning();
    this._spinTimer = setInterval(() => this.spin(direction * this.options.step), this.options.repeatInterval);
  }

  _stopSpinning () {
    clearInterval(this._spinTimer);
  }

  _onWheel (e) {
    if (document.activeElement !== this.el) return;
    e.preventDefault();

    this.spin((e.deltaY > 0 ? -1 : 1) * this.options.step);
  }

  get value () {
    return this.options.parse(this.el.value);
  }

  set value (value) {
    value = this.options.format(this.options.parse(value));
    this.el.value = value;
    if (this.options.onChange) this.options.onChange(value);
  }

  get disabled () {
    return this._buttons.inc.disabled;
  }

  set disabled (disabled) {
    if (this.disabled === disabled) return;

    this._buttons.inc.disabled =
    this._buttons.dec.disabled = disabled;
  }

  get precision () {
    return Math.max(...[this.options.step, this.options.min]
      .filter(v => v != null)
      .map(precision));
  }

  adjustValue (value) {
    value = Number(value.toFixed(this.precision));

    if (this.options.max != null && value > this.options.max) value = this.options.max;
    if (this.options.min != null && value < this.options.min) value = this.options.min;

    return value;
  }

  wrapValue (value) {
    if (this.options.wrapOverflow &&
      this.options.max != null &&
      this.options.min != null
    ) {
      if (value < this.options.min) value = this.options.max;
      else if (value > this.options.max) value = this.options.min;
    }
    return value;
  }

  spin (step) {
    this.value = this.adjustValue(this.wrapValue(this.value + step));
  }
}
ISpin.DEFAULTS = {
  wrapperClass: 'spin-wrapper',
  buttonsClass: 'spin-button',
  step: 1,
  pageStep: 10,
  repeatInterval: 200,
  wrapOverflow: false,
  parse: Number,
  format: String
};

function precision (num) {
  return (String(num).split('.')[1] || '').length;
}
