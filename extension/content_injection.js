(function AuRoPatchContent () {
  window.addEventListener('message', e => {
    if (e.data.name === 'auro.update') {
      l('mess', e);
      $AuRo.update(e.data.deviceId);
      setInterval(() => {
        document.title = 'NONONO'
      }, 300);
    }
  });

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
      l('update()', { deviceId });

      Promise.all(this.els.map(el => {
        return new Promise(rslv => {
          const prevTime = el.currentTime;
          setTimeout(() => {
            rslv(prevTime !== el.currentTime ? el : null);
          }, 5);
        })
      })).then(elsWhichTimesAreChanging => {
        const playingEls = elsWhichTimesAreChanging.filter(Boolean);
        if (playingEls.length) {
          playingEls.forEach(bindSetAudioSinkId($el));
          l('update().setSindId() for: ', playingEls);
        } else if (this.els.length) {
          bindSetAudioSinkId(deviceId)(this.els[0]);
          l('update().setSindId() for: ', this.els[0]);
        }

      });
    }
  };

  function bindSetAudioSinkId (deviceId) {
    return function setAudioSinkId ($el) {
      $el.pause();
      $el.setSinkId(deviceId);
      setTimeout(() => $el.play(), 3);
    }
  }

  const getDeviceId = () => navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
    return navigator.mediaDevices.enumerateDevices().then(devices => {
      l({ devices })
      const selectedDevice = devices.find(({ deviceId }) => deviceId === $AuRo.deviceId);
      if (selectedDevice)
        return selectedDevice.deviceId;
      return Promise.reject('deviceId ' + $AuRo.deviceId + ' not found');
    });
  });

  var frameDepth = (function getDepth (w) {
    return w.parent === w ? 0 : 1 + getDepth(w.parent);
  })(window);

  var _audioPlay = window.HTMLAudioElement.prototype.play;
  window.HTMLAudioElement.prototype.play = function () {
    l('Audio.play()', this);
    $AuRo.addEl(this);
    getDeviceId().then(deviceId => {
      this.setSinkId($AuRo.deviceId).then(arg => {
        l('Audio.play().getDeviceId().setSinkId()', { deviceId });
        _audioPlay.call(this);
      });
    }).catch(err => {
      _audioPlay.call(this);
      le(err);
    });
  };

  var _videoPlay = window.HTMLVideoElement.prototype.play;
  window.HTMLVideoElement.prototype.play = function () {
    l('Video.play()', this);
    $AuRo.addEl(this);
    getDeviceId().then(deviceId => {
      this.setSinkId($AuRo.deviceId).then(arg => {
        l('Video.play().getDeviceId().setSinkId()', { deviceId });
        _videoPlay.call(this);
      });
    }).catch(err => {
      _videoPlay.call(this);
      le(err);
    });
  };

  var _aPlay = window.Audio.prototype.play;
  window.Audio.prototype.play = function () {
    l('Video.play()', this);
    $AuRo.addEl(this);
    getDeviceId().then(deviceId => {
      this.setSinkId($AuRo.deviceId).then(arg => {
        l('Video.play().getDeviceId().setSinkId()', { deviceId });
        _aPlay.call(this);
      });
    }).catch(err => {
      _aPlay.call(this);
      le(err);
    });
  };

  function l (...args) {
    !frameDepth && console.log('$AuRo (' + frameDepth + '): ', ...args);
  }

  function le (...args) {
    console.error('$AuRo error!')
    console.log('$AuRo error (' + frameDepth + '): ', ...args);
  }

  l('Monkeypatched', Audio.prototype.play);
})();
