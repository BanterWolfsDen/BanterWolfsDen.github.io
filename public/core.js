class Core{
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
  }
  async init(hostUrl) {
    this.currentLatency = 0;
    this.imIn = false;
    this.hostUrl = hostUrl;
    this.defaultVideo = "https://www.youtube.com/watch?v=Di-qI09MdB8";
    if(this.params.announce === 'true') { 
      await this.setupSayNamesScript();
    }
    if(window.isBanter) {
      let lastSendTime = Date.now();
      const positionOfBrowser = this.params.position.split(" ");
      window.userPoseCallback = async pose => {
        if(this.params.spatial === 'true') {
          const minDistance = Number(this.params["spatial-min-distance"]);
          const maxDistance = Number(this.params["spatial-max-distance"]);
          const a = userinputs.head.position.x - positionOfBrowser[0];
          const b = userinputs.head.position.y - positionOfBrowser[1];
          const c = userinputs.head.position.z - positionOfBrowser[2];
          const distance = Math.sqrt(a * a + b * b + c * c);
          let volume = ((maxDistance - (distance - minDistance)) / maxDistance);
          if(volume > 1) {
            volume = 1;
          }else if(volume < 0) {
            volume = 0;
          }
          const now = Date.now();
          if(now - lastSendTime > 500) {
            lastSendTime = now;
            const roundedVolume = Math.round(this.params.volume * volume);
            if(this.tempVolume != roundedVolume) {
              this.sendBrowserMessage({path: Commands.SET_VOLUME, data: roundedVolume, type: 'spatial'});
            }
            this.tempVolume = roundedVolume; 
          }
        }
      }
      await window.AframeInjection.waitFor(window, 'user');
    }else{
      try{
        if(!window.user) {
          if(this.urlParams.has("user")) {
            var userStr = this.urlParams.get("user").split("-_-");
            window.user = {
              id: userStr[0],
              name: userStr[1]
            }
          }else{
            this.generateGuestUser();
          }
        }
      }catch{
        this.generateGuestUser();
      }
    }
  }
  setupBrowserElement(url) {
    this.initialUrl = url;
    const scene = document.querySelector("a-scene");
    if(!scene) {
      console.log("No a-scene tag found, is this an AFRAME scene ?");
      return;
    }
    const browser = document.createElement('a-entity');
    browser.setAttribute("position", this.params.position);
    browser.setAttribute("rotation", this.params.rotation);
    browser.setAttribute("scale", this.params.scale);
    if(this.params.is3d === true || this.params.is3d === 'true') {
      browser.setAttribute("sq-custommaterial", "shaderName: Banter/StereoscopicUnlit;");
    }
    browser.setAttribute("sq-browser", {"mipMaps": 1, "pixelsPerUnit": Number(this.params.resolution), "mode": "local", "url": url});
    // if(this.params.geometry) {
    //   const shape = document.createElement('a-entity');
    //   shape.setAttribute("geometry", this.params.geometry);
    //   if(this.params.material) {
    //     shape.setAttribute("material", this.params.material);
    //   }
    //   browser.appendChild(shape);
    // }
    scene.appendChild(browser);
    this.browser = browser;
    this.browser.addEventListener('browsermessage', (e) => {
      // console.log("got a browser message");
      // console.log(e);
    });
    this.setupBrowserUi();
  }
  clickBrowser(x,y) {
    this.browser.components['sq-browser'].runActions([{actionType: "click2d", numParam1: x, numParam2: y}])
  }
  setupBrowserUi() {
    const scene = document.querySelector("a-scene");
    if(!scene) {
      console.log("No a-scene tag found, is this an AFRAME scene ?");
      return;
    }
    
    const yScale = Number(this.params.scale.split(" ")[1]);
    const position = Number(this.params.position.split(" ")[0]) + " " + (Number(this.params.position.split(" ")[1]) - (yScale*0.335)) + " " + Number(this.params.position.split(" ")[2]);
    this.playlistContainer = document.createElement('a-entity');
    this.playlistContainer.setAttribute('position', this.params["button-position"] === "0 0 0" ? position : this.params["button-position"]);
    this.playlistContainer.setAttribute('rotation', this.params["button-rotation"] === "0 0 0" ? this.params.rotation : this.params["button-rotation"]);
    this.playlistContainer.setAttribute('scale', this.params["button-scale"]);
    <!-->this.setupPlaylistButton(scene, this.playlistContainer);
    this.setupVolButton(scene, true, this.playlistContainer);
    this.setupVolButton(scene, false, this.playlistContainer);
    this.setupMuteButton(scene, this.playlistContainer);
    <!-->this.setupSkipButton(scene, true, this.playlistContainer);
    <!-->this.setupSkipButton(scene, false, this.playlistContainer);
    scene.appendChild(this.playlistContainer);
  }
  setVolume(isUp) {
    if(isUp) {
      this.params.volume += 5;
      if(this.params.volume > 100) {
        this.params.volume = 100;
      }
    }else{
      this.params.volume -= 5;
      if(this.params.volume < 0) {
        this.params.volume = 0;
      }
    }
  }
  setupJoinLeaveButton() {
    const scene = document.querySelector("a-scene");
    if(!scene) {
      console.log("No a-scene tag found, is this an AFRAME scene ?");
      return;
    }
    const playlistButton = document.createElement('a-entity');
    playlistButton.setAttribute('sq-boxcollider', 'size: 1 0.3 0.05');
    playlistButton.setAttribute('sq-interactable', '');
    const buttonGlb = document.createElement('a-entity');
    buttonGlb.setAttribute('gltf-model','https://cdn.discordapp.com/attachments/1381281947422167080/1381284752157310986/ButtonL.glb?ex=6846f52b&is=6845a3ab&hm=23e3952f2bdb1b0a23b47edf0dc4a4aa03b685e1625ba3d0fd0bc13b55e0a6ab&');
    playlistButton.appendChild(buttonGlb);
    playlistButton.setAttribute('position', this.params["singer-button-position"]);
    playlistButton.setAttribute('rotation', this.params["singer-button-rotation"]);
    playlistButton.setAttribute('opacity', '0.3');
    playlistButton.setAttribute('transparent', 'true');
    this.playlistContainer.appendChild(playlistButton);
    const playlistButtonText = document.createElement('a-text');
    playlistButtonText.setAttribute('value', "singers");
    playlistButtonText.setAttribute('position', '0 0.01 0.03');
    playlistButtonText.setAttribute('align', 'center');
    playlistButtonText.setAttribute('scale', '0.8 0.8 0.8');
    playlistButton.appendChild(playlistButtonText);
    playlistButton.addEventListener('click', () => this.openPlaylist());
    const triggerEnter = this.params["box-trigger-enter-enabled"] === "true";
    const triggerExit = this.params["box-trigger-exit-enabled"] === "true"
    if(triggerEnter || triggerExit) {
      const boxTrigger = document.createElement('a-entity');
      boxTrigger.setAttribute('sq-boxcollider', '');
      boxTrigger.setAttribute('sq-triggercollider', '');
      boxTrigger.setAttribute('position', this.params["box-trigger-position"]);
      boxTrigger.setAttribute('rotation', this.params["box-trigger-rotation"]);
      boxTrigger.setAttribute('scale', this.params["box-trigger-scale"]);
      let hasStarted = false;
      let hasStartedTimeout;
      boxTrigger.addEventListener('trigger-enter', e => {
        if(e.detail.isLocalPlayer) {
          clearTimeout(hasStartedTimeout);
          if(triggerEnter && this.player && this.player.players.length && this.player.players[0].id === window.user.id && !hasStarted) {
            if(this.player.locked) {
              this.showToast("Player is locked! The host needs to unlock it first!");
            }else{
              this.sendMessage({path: Commands.CLEAR_PLAYLIST, skipUpdate: true});
              this.sendMessage({path: Commands.ADD_TO_PLAYLIST, data: this.player.players[0].v, isYoutubeWebsite: false, skipUpdate: true });
              this.sendMessage({path: Commands.SET_TRACK, data: 0});
              hasStarted = true;
            }
          }
        }
      });
      boxTrigger.addEventListener('trigger-exit', e => {
        if(e.detail.isLocalPlayer) {
          clearTimeout(hasStartedTimeout);
          hasStartedTimeout = setTimeout(() => {
            if(triggerExit && this.player && this.player.players.length && hasStarted) {
              const player = this.player.players[0];
              console.log(player.id, window.user.id, this.player);
              if(player.id === window.user.id) {
                  this.sendMessage({path: Commands.REMOVE_FROM_PLAYERS, data: player.id });
                  this.sendMessage({path: Commands.CLEAR_PLAYLIST, skipUpdate: true});
                  this.sendMessage({path: Commands.STOP});
                  hasStarted = false;
              }
            }
          }, 5000);
        }
      });
      this.playlistContainer.appendChild(boxTrigger);
    }
  }
  showToast(text) {
    if(Toastify) {
      Toastify({
        text: text,
        duration: 1000,
        // close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        // stopOnFocus: true, // Prevents dismissing of toast on hover
        style: {
          background: "url(https://cdn.discordapp.com/attachments/1381281947422167080/1381284751939473550/angryimg.png?ex=6846f52b&is=6845a3ab&hm=9fb9dbde946b33724ebc5887a816a65c9d358aad1366afc3a09ded1591b99823&) center center no-repeat",
          backgroundSize: "cover",
          opacity: 0.7,
          fontSize: "1em",
          fontFamily: "'Roboto', sans-serif"
        },
        // onClick: function(){} // Callback after click
      }).showToast();
    }
  }
  setupPlaylistButton(scene, playlistContainer) {
    this.setupButton(scene, playlistContainer, '-1.7', this.isKaraoke ? 'singers' : 'playlist', '1',  'large',  ()=>{
      this.openPlaylist();
    })
  }
  openPlaylist() {
    window.openPage("https://" + this.hostUrl + "/" + (this.isKaraoke ? 'karaoke' : 'playlist') + "/?instance=" + this.params.instance + ( this.params.playlist ? "&playlist=" + this.params.playlistId : "") + "&user=" + window.user.id +"-_-"+encodeURIComponent(window.user.name));
  }
  setupVolButton(scene, isUp, playlistContainer) {
    this.setupButton(scene, playlistContainer, isUp ? 1.78 : 1.25, isUp ? '+ vol' : '- vol', '0.5', 'medium', ()=>{
        this.setVolume(isUp);
        if(isUp && this.params.mute == 'true') {
          this.params.mute = 'false';
          this.sendBrowserMessage({path: Commands.MUTE, data: this.params.mute});
        }
        this.sendBrowserMessage({path: Commands.SET_VOLUME, data: this.params.volume});
    })
  }
  setupSkipButton(scene, isBack, playlistContainer) {
    this.setupButton(scene, playlistContainer, isBack ? -0.475 : -0.125, isBack ? '<<' : '>>', '0.5',  'small', () => {
        this.sendBrowserMessage({path: isBack? Commands.SKIP_BACK : Commands.SKIP_FORWARD});
    })
  }
  setupMuteButton(scene, playlistContainer) {
    this.setupButton(scene, playlistContainer, '0.73', 'mute', '0.5',  'medium', () => {
      this.params.mute = this.params.mute == 'true' ? 'false' : 'true';
      this.sendBrowserMessage({path: Commands.MUTE, data: this.params.mute});
    })
  }
  setupButton(scene, playlistContainer, xOffset, title, width, size, callback) {
    const buttonContainer = document.createElement('a-entity');
    
    buttonContainer.setAttribute('position', `${xOffset} 0 0`); 
    
    const playlistButton = document.createElement('a-entity');
    playlistButton.setAttribute('sq-boxcollider', `size: ${size == 'small' ? '0.3 0.2 0.05': size == 'medium' ? '0.45 0.2 0.05' : '0.6 0.2 0.05' }`);
    playlistButton.setAttribute('sq-interactable', '');
    playlistButton.setAttribute('src', 'https://cdn.discordapp.com/attachments/1381281947422167080/1381284751939473550/angryimg.png?ex=6846f52b&is=6845a3ab&hm=9fb9dbde946b33724ebc5887a816a65c9d358aad1366afc3a09ded1591b99823&');
    
    const glb = size == 'small' ? 'https://cdn.discordapp.com/attachments/1381281947422167080/1381284753189376060/ButtonS.glb?ex=6846f52c&is=6845a3ac&hm=0147d25179d2981f703728841e31f992fa95f37651c1b2f265166b49d112a74b&' 
    : size == 'medium' ? 'https://cdn.discordapp.com/attachments/1381281947422167080/1381284752547385464/ButtonM.glb?ex=6846f52c&is=6845a3ac&hm=4cb668706bf6d3bb20dbd73dbce1fee059a94264c130aa1a79efd00bd16654ee&'
    : 'https://cdn.discordapp.com/attachments/1381281947422167080/1381284752157310986/ButtonL.glb?ex=6846f52b&is=6845a3ab&hm=23e3952f2bdb1b0a23b47edf0dc4a4aa03b685e1625ba3d0fd0bc13b55e0a6ab&';
    
    playlistButton.setAttribute('gltf-model',glb);
    // playlistButton.setAttribute('depth', '0.05');
    playlistButton.setAttribute('opacity', '0.3');
    playlistButton.setAttribute('transparent', 'true');
    // playlistButton.setAttribute('width', width);
    // playlistButton.setAttribute('height', '0.3');
    const playlistButtonText = document.createElement('a-text');
    playlistButtonText.setAttribute('value', title);
    playlistButtonText.setAttribute('position', '0 0.01 0.03');
    playlistButtonText.setAttribute('align', 'center');
    playlistButtonText.setAttribute('scale', '0.8 0.8 0.8');
    buttonContainer.appendChild(playlistButtonText);
    buttonContainer.appendChild(playlistButton);
    playlistContainer.appendChild(buttonContainer);
    playlistButton.addEventListener('click', ()=>{
      callback();
    });
    return playlistButtonText;
  }
  generateGuestUser() {
    const id = this.getUniquId();
    window.user = {id, name: "Guest " + id};
    localStorage.setItem('user', JSON.stringify(window.user));
  }
  getUniquId() {
    return (Math.random() + 1).toString(36).substring(7);
  }
  parseParams(currentScript) {
    this.currentScript = currentScript;
    this.setOrDefault("position", "0 0 0");
    this.setOrDefault("rotation", "0 0 0");
    this.setOrDefault("scale", "1 1 1");
    const yScale = Number(this.params.scale.split(" ")[1]);
    this.setOrDefault("singer-button-position", `0 ${-yScale*0.335} 3`);
    this.setOrDefault("singer-button-rotation", "-30 180 0");
    this.setOrDefault("button-position", `0 0 0`);
    this.setOrDefault("button-rotation", `0 0 0`);
    this.setOrDefault("button-scale", `1 1 1`);
    this.setOrDefault("box-trigger-enter-enabled", 'false');
    this.setOrDefault("box-trigger-exit-enabled", 'false');
    this.setOrDefault("box-trigger-position", '0 0 0');
    this.setOrDefault("box-trigger-rotation", '0 0 0');
    this.setOrDefault("box-trigger-scale", '1 1 1');
    this.setOrDefault("resolution", '1600');
    this.setOrDefault("one-for-each-instance", "false");
    this.setOrDefault("instance", location.href);
    this.setOrDefault("playlist", "");
    this.setOrDefault("volume", '40');
    this.setOrDefault("mute", 'false');
    this.setOrDefault("is3d", 'false');
    this.setOrDefault("announce", 'true');
    this.setOrDefault("spatial", 'true');
    this.setOrDefault("spatial-min-distance", '5');
    this.setOrDefault("spatial-max-distance", '40');
    this.setOrDefault("youtube", "https://www.youtube.com/watch?v=Di-qI09MdB8");
    
    this.params.volume = Number(this.params.volume);
    this.tempVolume = this.params.volume;
    this.params.mute = this.params.mute === 'true' ? 'true' : 'false';
    if(this.params["one-for-each-instance"] === "true" && window.user && window.user.instance) {
      this.params.instance += window.user.instance;
    }
  }
  setOrDefault(attr, defaultValue) {
    const value = this.currentScript.getAttribute(attr);
    this.params = this.params || {};
    this.params[attr] = value || (this.urlParams.has(attr) ? this.urlParams.get(attr) : defaultValue);
  }
  setupWebsocket(type, messageCallback, connectedCallback, closeCallback){
    return new Promise(resolve => {
      this.ws = new WebSocket('wss://' + this.hostUrl + '/');
      this.ws.onopen = (event) => {
        console.log("Websocket connected!");
        resolve();
        connectedCallback();
        this.sendMessage({path: Commands.SET_WS_TYPE, data: type})
      };
      this.ws.onmessage = (event) => {
        if(typeof event.data === 'string'){
          messageCallback ? messageCallback(event.data) : this.parseMessage(event.data);
        }
      }
      this.ws.onclose =  (event) => {
        console.log("Websocket closed...");
        setTimeout(() => {
          if(closeCallback) {
            closeCallback();
          }
          this.setupWebsocket(type, messageCallback, connectedCallback, closeCallback);
        }, 1000);
      };
    });
  }
  setupLatencyMeasure() {
    const measure = async () => {
      const time = Date.now();
      await this.measureLatency();
      this.currentLatency = (Date.now()-time)/2/1000;
    };
    setInterval(measure , 5000);
    measure();
  }
  measureLatency() {
    return new Promise(resolve=>{
      this.sendMessage({path: Commands.MEASURE_LATENCY});
      this.measureLatencyResolve = resolve;
    })
  }
  connected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
  sendMessage(msg){
    msg.u = window.user;
    if(this.connected()) {
      this.ws.send(JSON.stringify(msg));
    }
  }
  recieveBrowserMessage(msg) {
    if(msg.id && this.browserAcks[msg.id]) {
      this.browserAcks[msg.id]();
      this.browserAcks[msg.id] = null;
    }else{
      switch(msg.path) {
          // handle other direct messages from the browser
      }
    }
  }
  sendBrowserMessage(msg){
    if(!window.isBanter) {
      return;
    }
    this.browserAcks = this.browserAcks || {};
    msg.u = window.user;
    msg.i = this.params.instance;
    msg.id = this.getUniquId();
    return new Promise((resolve, reject) => {
      if(this.browser) {
        this.browserAcks[msg.id] = resolve;
        this.browser.components['sq-browser'].runActions([{actionType: "postmessage", strParam1: JSON.stringify(msg)}]);
      }else{
        reject();
      }
    });
  }
  makeAndAddElement(type, style, parent) {
    const element = document.createElement(type);
    Object.assign(element.style, style || {});
    (parent ? parent : document.body).appendChild(element);
    return element;
  }
  getYTId(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
  }
  parseMessage(msg) {
    const json = JSON.parse(msg);
    switch(json.path) {
      case Commands.ERROR:
        alert("I cant let you do that...");
        break;
      case Commands.MEASURE_LATENCY:
        if(this.measureLatencyResolve){
          this.measureLatencyResolve();
          this.measureLatencyResolve = null;
        }
        break;
      case Commands.RESET_BROWSER:
        if(window.isBanter && this.browser) {
          this.browser.setAttribute("sq-browser", {"url": this.initialUrl});
        }
        break;
      case Commands.STOP:
      case Commands.PLAYBACK_UPDATE:
        this.player = json.data.video;
        this.player.players.sort((a, b) => a.p - b.p);
      case Commands.SYNC_TIME:
        json.volume = this.tempVolume;
        this.sendBrowserMessage(json);
      case Commands.SET_BROWSER_URL:
        if(window.isBanter && this.browser) {
          this.browser.setAttribute("sq-browser", {"url": json.data.link, "afterLoadActions": [ { "actionType": "delayseconds", "numParam1": 0.75}, {"actionType": "click2d", "numParam1": 150, "numParam2": 150}]});
        }
        break;
      case Commands.CLICK_BROWSER:
        if(window.isBanter) {
          this.clickBrowser(json.data.x,json.data.y);
        }
        break;
    }
  }
  getId(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
  }
  setupSayNamesScript(callback) {
    return this.setupScript(callback, "say-names");
  }
  setupCommandsScript(callback) {
    return this.setupScript(callback, "commands");
  }
  setupScript(callback, name) {
    return new Promise(resolve => {
      let myScript = document.createElement("script");
      myScript.setAttribute("src", `https://${this.hostUrl}/${name}.js`);
      myScript.addEventListener ("load", resolve, false);
      document.body.appendChild(myScript);  
    });
  }
}
window.videoPlayerCore = new Core();

/*
 <script>
        setTimeout(() => {
          window.openPage("https://spotc.glitch.me/menu.html");

        }, 6000);
                setTimeout(() => {
          window.banter.sendMenuBrowserMessage("here r message");

        }, 10000);
        window.addEventListener("menubrowsermessage", (e) => {
          console.log("got thing");
          window.banter.sendMenuBrowserMessage("ok did get: " + e.detail.message);
          console.log(e);
        });
        

      </script>
*/