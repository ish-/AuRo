export function main () {
  window.$AuRo = {
    els: [],
    addEl (el) {
      let i = this.els.indexOf(el);
      if (~i)
        this.els.splice(i, 1);
      this.els.unshift(el);
    },

    deviceId: null,
    update (deviceId) {
      $AuRo.deviceId = deviceId;
      auro.logging.log(`update(${deviceId})`);

      Promise.all(this.els.map(el => {
        return new Promise(rslv => {
          const prevTime = el.currentTime;
          setTimeout(() => {
            rslv(prevTime !== el.currentTime ? el : null);
          }, 5);
        })
      })).then(elsWhichTimesAreChanging => {
        const playingEls = elsWhichTimesAreChanging.filter(Boolean);
        playingEls.forEach(el => {
          el.pause();
          el.setSinkId(deviceId);
          setTimeout(() => el.play(), 3);
        })

        auro.logging.log(`update().setSinkId(${deviceId}) for: `, playingEls);
      });
    }
  };

  async function getDeviceId () {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const devices = await navigator.mediaDevices.enumerateDevices();

    const selectedDevice = devices.find(({ deviceId }) => deviceId === $AuRo.deviceId);

    if (selectedDevice) {
      return selectedDevice.deviceId;
    } else {
      auro.logging.warn('Requested output device was not found. It was probably disconnected. You might want to update your preferred device.');
      auro.logging.warn('Falling back to the default output device.');
      return '';
    }
  }

  function patch (element, name) {
    if (element.prototype.play.$AuRoPatched) {
      auro.logging.log(`${name} is already patched. Skipping!`);
      return;
    }

    const _elPlay = element.prototype.play;
    element.prototype.play = async function () {
      auro.logging.log(`${name}.play()`, 'wrapper', this);

      $AuRo.addEl(this);

      try {
        const deviceId = await getDeviceId();

        auro.logging.log(`${name}.setSinkId(${deviceId})`);

        await this.setSinkId(deviceId);
      } catch (err) {
        auro.logging.error(err);
      } finally {
        auro.logging.log(`${name}.play()`, _elPlay);
        await _elPlay.call(this);
      }
    };
    element.prototype.play.$AuRoPatched = true;
  }

  patch(HTMLAudioElement, 'HTMLAudioElement');
  patch(HTMLVideoElement, 'HTMLVideoElement');

  auro.logging.log('Monkeypatched');
}

export function updateOutputDevice (deviceId) {
  if (typeof $AuRo !== 'undefined') {
    $AuRo.update(deviceId);
  }
}
