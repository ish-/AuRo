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
      auro.logging.log('update()', { deviceId });

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

        auro.logging.log(`update().setSinkId(${ deviceId }) for: `, playingEls);
      });
    }
  };

  const getDeviceId = () => navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
    return navigator.mediaDevices.enumerateDevices().then(devices => {
      auro.logging.log({ devices })
      const selectedDevice = devices.find(({ deviceId }) => deviceId === $AuRo.deviceId);
      if (selectedDevice)
        return selectedDevice.deviceId;
      return Promise.reject('deviceId ' + $AuRo.deviceId + ' not found');
    });
  });

  var _audioPlay = HTMLAudioElement.prototype.play;
  HTMLAudioElement.prototype.play = function () {
    auro.logging.log('Audio.play()', this);
    $AuRo.addEl(this);
    return getDeviceId().then(deviceId => {
      return this.setSinkId($AuRo.deviceId).then(() => {
        auro.logging.log('Audio.play().getDeviceId().setSinkId()', { deviceId });
        return _audioPlay.call(this);
      });
    }).catch(err => {
      auro.logging.error(err);
      return _audioPlay.call(this);
    });
  };

  var _videoPlay = HTMLVideoElement.prototype.play;
  HTMLVideoElement.prototype.play = function () {
    auro.logging.log('Video.play()', this);
    $AuRo.addEl(this);
    return getDeviceId().then(deviceId => {
      return this.setSinkId($AuRo.deviceId).then(() => {
        auro.logging.log('Video.play().getDeviceId().setSinkId()', { deviceId });
        return _videoPlay.call(this);
      });
    }).catch(err => {
      auro.logging.error(err);
      return _videoPlay.call(this);
    });
  };

  var _aPlay = Audio.prototype.play;
  Audio.prototype.play = function () {
    auro.logging.log('Audio.play()', this);
    $AuRo.addEl(this);
    return getDeviceId().then(deviceId => {
      return this.setSinkId($AuRo.deviceId).then(() => {
        auro.logging.log('Audio.play().getDeviceId().setSinkId()', { deviceId });
        return _aPlay.call(this);
      });
    }).catch(err => {
      auro.logging.error(err);
      return _aPlay.call(this);
    });
  };

  auro.logging.log('Monkeypatched');
}

export function updateOutputDevice (deviceId) {
  if (typeof $AuRo !== 'undefined') {
    $AuRo.update(deviceId);
  }
}
