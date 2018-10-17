// @flow

type SpinDirection = (1 | -1);
type SpinOptions = {
  wrapperClass: string,
  buttonsClass: string,
  step: number,
  pageStep: number,
  repeatInterval: number,
  wrapOverflow: boolean,
  parse: string => number,
  format: number => string,
  disabled: boolean,
  max?: number,
  min?: number,
  onChange?: string => void,
};


export default
class ISpin {
  static DEFAULTS: $Shape<SpinOptions>;
  el: HTMLInputElement;
  options: SpinOptions;
  _onKeyDown: (e: KeyboardEvent) => void;
  _onMouseDown: (e: MouseEvent) => void;
  _onMouseUp: (e: MouseEvent) => void;
  _onMouseLeave: (e: MouseEvent) => void;
  _onWheel: (e: WheelEvent) => void;
  _wrapper: HTMLElement;
  _buttons: {
    inc: HTMLButtonElement,
    dec: HTMLButtonElement
  };
  _spinTimer: IntervalID;

  constructor (el: HTMLInputElement, opts: $Shape<SpinOptions>) {
    this.el = el;
    // $FlowFixMe temporary assignment
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
    if (this.el.parentNode) this.el.parentNode.replaceChild(this._wrapper, this.el);
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

  update (opts: $Shape<SpinOptions>) {
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
    if (this._wrapper.parentNode) this._wrapper.parentNode.replaceChild(this.el, this._wrapper);
    delete this.el;
    delete this._wrapper;
    delete this._buttons;
  }

  _onKeyDown (e: KeyboardEvent) {
    switch (e.keyCode) {
      case 38: // arrow up
        e.preventDefault();
        return this.spin(this.options.step);
      case 40: // arrow down
        e.preventDefault();
        return this.spin(-this.options.step);
      case 33: // page up
        e.preventDefault();
        return this.spin(this.options.pageStep);
      case 34: // page down
        e.preventDefault();
        return this.spin(-this.options.pageStep);
    }
  }

  _onMouseDown (e: MouseEvent) {
    e.preventDefault();

    const direction: SpinDirection = e.currentTarget === this._buttons.inc ? 1 : -1;
    this.spin(direction * this.options.step);
    this.el.focus();

    this._startSpinning(direction);
  }

  _onMouseUp (e: MouseEvent) {
    this._stopSpinning();
  }

  _onMouseLeave (e: MouseEvent) {
    this._stopSpinning();
  }

  _startSpinning (direction: SpinDirection) {
    this._stopSpinning();
    this._spinTimer = setInterval(() => this.spin(direction * this.options.step), this.options.repeatInterval);
  }

  _stopSpinning () {
    clearInterval(this._spinTimer);
  }

  _onWheel (e: WheelEvent) {
    if (document.activeElement !== this.el) return;
    e.preventDefault();

    const direction: SpinDirection = (e.deltaY > 0 ? -1 : 1);
    this.spin(direction * this.options.step);
  }

  get value (): number {
    return this.options.parse(this.el.value) || 0;
  }

  set value (value: number) {
    const strValue = this.options.format(this.options.parse(String(value)));
    this.el.value = strValue;
    if (this.options.onChange) this.options.onChange(strValue);
  }

  get disabled (): boolean {
    return this._buttons.inc.disabled;
  }

  set disabled (disabled: boolean) {
    if (this.disabled === disabled) return;

    this._buttons.inc.disabled =
    this._buttons.dec.disabled = disabled;
  }

  get precision (): number {
    return Math.max(...[this.options.step, this.options.min]
      .filter(v => v != null)
      // $FlowFixMe already checked above
      .map(precision));
  }

  adjustValue (value: number): number {
    value = Number(value.toFixed(this.precision));

    if (this.options.max != null && value > this.options.max) value = this.options.max;
    if (this.options.min != null && value < this.options.min) value = this.options.min;

    return value;
  }

  wrapValue (value: number): number {
    if (this.options.wrapOverflow &&
      this.options.max != null &&
      this.options.min != null
    ) {
      if (value < this.options.min) value = this.options.max;
      else if (value > this.options.max) value = this.options.min;
    }
    return value;
  }

  spin (step: number) {
    this.value = this.adjustValue(this.wrapValue(this.value + step));
  }
}
ISpin.DEFAULTS = {
  wrapperClass: 'ispin-wrapper',
  buttonsClass: 'ispin-button',
  step: 1,
  pageStep: 10,
  disabled: false,
  repeatInterval: 200,
  wrapOverflow: false,
  parse: Number,
  format: String
};

function precision (num: number) {
  return (String(num).split('.')[1] || '').length;
}
