<template>
  <div class="audio-container">
    <div class="message-content">
      <!-- Foto do lado esquerdo (para mensagens enviadas por mim) -->
      <div class="photo-container left" v-if="fromMe">
        <q-avatar size="40px">
          <img
            :src="profilePicUrl || contact?.profilePicUrl"
            v-show="profilePicUrl || contact?.profilePicUrl"
            @error="$event.target.style.display='none'"
          >
          <q-icon
            v-if="!profilePicUrl && !contact?.profilePicUrl"
            name="person"
            size="40px"
            color="grey-5"
          />
        </q-avatar>
        <q-icon
          name="mic"
          size="0.9rem"
          color="positive"
          class="mic-icon"
        />
        <!-- Botão de aceleração em cima da foto -->
        <div class="rate-selector photo-top" @click.stop="toggleRate">
          {{ formatRate(audioRate) }}x
        </div>
      </div>

      <q-btn
        flat
        round
        dense
        :icon="isPlaying ? 'pause' : 'play_arrow'"
        @click="togglePlayPause"
        class="play-pause-btn"
      />

      <div class="time-container">
        <div class="time-label">
          {{ formattedCurrentTime }}
        </div>
        <div
          class="visualizer-container"
          ref="waveformRef"
          @click="handleVisualizerClick"
        />
        <div class="duration-label">
          {{ formattedDuration }}
        </div>
      </div>

      <!-- Foto do lado direito (para mensagens recebidas) -->
      <div class="photo-container right" v-if="!fromMe">
        <q-avatar size="40px">
          <img
            :src="profilePicUrl || contact?.profilePicUrl"
            v-show="profilePicUrl || contact?.profilePicUrl"
            @error="$event.target.style.display='none'"
          >
          <q-icon
            v-if="!profilePicUrl && !contact?.profilePicUrl"
            name="person"
            size="40px"
            color="grey-5"
          />
        </q-avatar>
        <q-icon
          name="mic"
          size="0.9rem"
          color="positive"
          class="mic-icon"
        />
        <!-- Botão de aceleração em cima da foto -->
        <div class="rate-selector photo-top" @click.stop="toggleRate">
          {{ formatRate(audioRate) }}x
        </div>
      </div>
    </div>

    <audio
      ref="audioRef"
      :src="url"
      type="audio/mpeg"
      @loadedmetadata="handleLoadedMetadata"
      @timeupdate="handleTimeUpdate"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleEnded"
    >
      Seu navegador não suporta o elemento de áudio.
    </audio>
  </div>
</template>

<script>
import WaveSurfer from 'wavesurfer.js'

const LS_NAME = 'audioMessageRate'

export default {
  name: 'AudioVisualizer',
  props: {
    url: {
      type: String,
      required: true
    },
    contact: {
      type: Object,
      default: () => ({})
    },
    avatarSrc: {
      type: String,
      default: ''
    },
    fromMe: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      audioRate: parseFloat(localStorage.getItem(LS_NAME) || '1'),
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      formattedCurrentTime: '0:00',
      formattedDuration: '0:00',
      showRateControl: false,
      wavesurfer: null,
      profilePicUrl: null
    }
  },
  watch: {
    avatarSrc: {
      immediate: true,
      handler (newVal) {
        if (newVal) {
          this.profilePicUrl = newVal
        }
      }
    }
  },
  methods: {
    async loadProfilePic () {
      if (!this.contact?.number) return

      try {
        const profilePicUrl = await this.$store.dispatch('profilePicUrl', this.contact.number)
        if (profilePicUrl) {
          this.$set(this.contact, 'profilePicUrl', profilePicUrl)
        }
      } catch (error) {
        console.error('Erro ao carregar foto de perfil:', error)
      }
    },
    formatRate (rate) {
      return rate
    },
    formatTime (time) {
      if (isNaN(time)) return '0:00'
      const minutes = Math.floor(time / 60)
      const seconds = Math.floor(time % 60)
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    },
    togglePlayPause () {
      if (this.wavesurfer) {
        this.wavesurfer.playPause()
      }
    },
    toggleRate () {
      const rates = [1, 1.5, 2]
      const currentIndex = rates.indexOf(this.audioRate)
      const nextRate = rates[(currentIndex + 1) % rates.length]
      this.setRate(nextRate)
    },
    setRate (rate) {
      this.audioRate = rate
      if (this.wavesurfer) {
        this.wavesurfer.setPlaybackRate(rate)
      }
      localStorage.setItem(LS_NAME, rate)
    },
    handleLoadedMetadata () {
      const audio = this.$refs.audioRef
      this.duration = audio.duration
      this.formattedDuration = this.formatTime(audio.duration)
    },
    handleTimeUpdate () {
      const audio = this.$refs.audioRef
      this.currentTime = audio.currentTime
      this.formattedCurrentTime = this.formatTime(audio.currentTime)
    },
    handlePlay () {
      this.isPlaying = true
      this.showRateControl = true
    },
    handlePause () {
      this.isPlaying = false
    },
    handleEnded () {
      this.isPlaying = false
      this.currentTime = 0
      this.formattedCurrentTime = '0:00'
      this.showRateControl = false
    },
    handleVisualizerClick (event) {
      if (this.wavesurfer) {
        const rect = this.$refs.waveformRef.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const ratio = clickX / rect.width
        this.wavesurfer.seekTo(ratio)
      }
    },
    initWaveSurfer () {
      // Garantir que o contêiner do waveform existe
      if (!this.$refs.waveformRef) {
        console.error('Contêiner waveform não encontrado')
        return
      }

      this.wavesurfer = WaveSurfer.create({
        container: this.$refs.waveformRef,
        waveColor: '#999',
        progressColor: this.fromMe ? '#128c7e' : '#1976D2',
        cursorColor: 'transparent',
        barWidth: 2,
        barGap: 1,
        height: 35,
        responsive: true,
        normalize: true,
        fillParent: true,
        minPxPerSec: 50,
        interact: true
      })

      this.wavesurfer.load(this.url)

      this.wavesurfer.on('play', () => {
        this.isPlaying = true
        this.showRateControl = true
      })

      this.wavesurfer.on('pause', () => {
        this.isPlaying = false
      })

      this.wavesurfer.on('finish', () => {
        this.handleEnded()
      })

      this.wavesurfer.on('audioprocess', () => {
        this.currentTime = this.wavesurfer.getCurrentTime()
        this.formattedCurrentTime = this.formatTime(this.currentTime)
      })

      this.wavesurfer.on('ready', () => {
        this.duration = this.wavesurfer.getDuration()
        this.formattedDuration = this.formatTime(this.duration)
        this.wavesurfer.setPlaybackRate(this.audioRate)
      })
    }
  },
  async mounted () {
    // Usar setTimeout para garantir que o componente está completamente renderizado
    setTimeout(() => {
      this.initWaveSurfer()
    }, 100)

    await this.loadProfilePic()
  },
  beforeDestroy () {
    if (this.wavesurfer) {
      this.wavesurfer.destroy()
    }
  }
}
</script>

<style lang="scss" scoped>
.audio-container {
  display: flex;
  flex-direction: column;
  padding: 8px;
  margin-bottom: 0; /* Ajustado para 0 para eliminar espaço extra */
  border-radius: 0; /* Removido para se integrar com q-chat-message */
  background-color: transparent; /* Transparente para usar o bg do q-chat-message */
  width: 100%; /* Usar toda a largura disponível */
  position: relative;
  box-sizing: border-box;
}

.message-content {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
}

.photo-container {
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;

  &.left {
    margin-right: 8px;
  }

  &.right {
    margin-left: 8px;
  }
}

.mic-icon {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: white;
  border-radius: 50%;
  padding: 2px;
  box-shadow: 0px 1px 2px rgba(0,0,0,0.2);
}

.play-pause-btn {
  padding: 0;
  margin-right: 8px;
  min-width: 36px;
  height: 36px;
  background-color: #fff;
  border-radius: 50%;
  color: #128c7e;

  &:hover {
    background-color: #f0f0f0;
  }
}

.time-container {
  display: flex;
  flex: 1;
  align-items: center;
  position: relative;
}

.time-label {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.7);
  min-width: 30px;
  padding: 0 4px;
}

.duration-label {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.7);
  min-width: 30px;
  padding: 0 4px;
}

.rate-selector {
  font-size: 0.75rem;
  background-color: rgba(0, 0, 0, 0.1);
  color: #128c7e;
  padding: 2px 6px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }

  &.photo-top {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    transition: all 0.2s ease;
    opacity: 0;

    .photo-container:hover & {
      opacity: 1;
    }
  }
}

.visualizer-container {
  flex: 1;
  position: relative;
  cursor: pointer;
  height: 33px;
  margin: 0;
  padding: 0;
  z-index: 1;
  min-width: 150px; /* Garantir largura mínima para o waveform */
}
</style>
