<template>
  <div class="q-pa-md">
    <transition-group
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <template v-for="(mensagem, index) in       mensagens      ">
        <hr
          v-if="isLineDate"
          :key="'hr-' + index"
          class="hr-text q-mt-lg q-mb-md"
          :data-content="formatarData(mensagem.createdAt)"
          v-show="index === 0 || formatarData(mensagem.createdAt) !== formatarData(mensagens[index - 1].createdAt)"
        >
        <template v-if="mensagens.length && index === mensagens.length - 1">
          <div
            :key="`ref-${mensagem.createdAt}`"
            ref="lastMessageRef"
            id="lastMessageRef"
            style="float: 'left', background: 'black', clear: 'both'"
          />
        </template>
        <div
          :key="`chat-message-${mensagem.id}`"
          :id="`chat-message-${mensagem.id}`"
        />
        <q-chat-message
          :key="mensagem.id"
          :stamp="dataInWords(mensagem.createdAt)"
          :sent="mensagem.fromMe"
          class="text-weight-medium"
          :bg-color="mensagem.fromMe ? 'grey-2' : $q.dark.isActive ? 'blue-2' : 'blue-1'"
          :class="{ pulseIdentications: identificarMensagem == `chat-message-${mensagem.id}` }"
        >
          <!-- :bg-color="mensagem.fromMe ? 'grey-2' : 'secondary' " -->
          <div
            style="min-width: 100px; max-width: 350px;"
            :style="mensagem.isDeleted ? 'color: rgba(0, 0, 0, 0.36) !important;' : ''"
          >
            <q-checkbox
              v-if="ativarMultiEncaminhamento"
              :key="`cheked-chat-message-${mensagem.id}`"
              :class="{
                  'absolute-top-right checkbox-encaminhar-right': !mensagem.fromMe,
                  'absolute-top-left checkbox-encaminhar-left': mensagem.fromMe
                }"
              :ref="`box-chat-message-${mensagem.id}`"
              @click.native="verificarEncaminharMensagem(mensagem)"
              :value="false"
            />

            <q-icon
              class="q-ma-xs"
              name="mdi-calendar"
              size="18px"
              :class="{
                  'text-primary': mensagem.scheduleDate && mensagem.status === 'pending',
                  'text-positive': !['pending', 'canceled'].includes(mensagem.status)
                }"
              v-if="mensagem.scheduleDate"
            >
              <q-tooltip content-class="bg-secondary text-grey-8">
                <div class="row col">
                  Mensagem agendada
                </div>
                <div
                  class="row col"
                  v-if="mensagem.isDeleted"
                >
                  <q-chip
                    color="red-3"
                    icon="mdi-trash-can-outline"
                  >
                    Envio cancelado: {{ formatarData(mensagem.updatedAt, 'dd/MM/yyyy') }}
                  </q-chip>
                </div>
                <div class="row col">
                  <q-chip
                    color="blue-1"
                    icon="mdi-calendar-import"
                  >
                    Criado em: {{ formatarData(mensagem.createdAt, 'dd/MM/yyyy HH:mm') }}
                  </q-chip>
                </div>
                <div class="row col">
                  <q-chip
                    color="blue-1"
                    icon="mdi-calendar-start"
                  >
                    Programado para: {{ formatarData(mensagem.scheduleDate, 'dd/MM/yyyy HH:mm') }}
                  </q-chip>
                </div>
              </q-tooltip>
            </q-icon>
            <div v-if="mensagem.edited" class="text-italic">
              Editada: {{ mensagem.edited }}
            </div>
            <div v-if="mensagem.edited" class="text-italic">
              Mensagem anterior:<br>
            </div>
            <div
              v-if="mensagem.isDeleted"
              class="text-italic"
            >
              Mensagem apagada em {{ formatarData(mensagem.updatedAt, 'dd/MM/yyyy') }}.
            </div>
            <div v-if="isGroupLabel(mensagem) && !mensagem.fromMe"
                 class="q-mb-sm"
                 style="display: flex; align-items: center; color: rgb(59 23 251); fontWeight: 500;">
              <q-avatar v-if="mensagem.contact && mensagem.contact.profilePicUrl"
                        size="40px"
                        class="q-mr-sm">
                <img :src="mensagem.contact.profilePicUrl" alt="Profile Picture">
              </q-avatar>
              {{ isGroupLabel(mensagem) }}
            </div>
            <div v-if="mensagem.quotedMsg" :class="{ textContentItem: !mensagem.isDeleted, textContentItemDeleted: mensagem.isDeleted }" @click="focarMensagem(mensagem.quotedMsg)">
              <MensagemRespondida
                style="max-width: 240px; max-height: 150px"
                class="row justify-center"
                :mensagem="mensagem.quotedMsg"
              />
            </div>
            <q-btn
              v-if=" !mensagem.isDeleted && isShowOptions "
              class="absolute-top-right mostar-btn-opcoes-chat"
              dense
              flat
              ripple
              round
              icon="mdi-chevron-down"
            >
              <q-menu
                square
                auto-close
                anchor="bottom left"
                self="top left"
              >
                <q-list style="min-width: 100px">
                  <q-item
                    :disable=" !['whatsapp', 'telegram'].includes(ticketFocado.channel) "
                    clickable
                    @click=" citarMensagem(mensagem) "
                  >
                    <q-item-section>Responder</q-item-section>
                    <q-tooltip v-if=" !['whatsapp', 'telegram'].includes(ticketFocado.channel) ">
                      Disponível apenas para WhatsApp e Telegram
                    </q-tooltip>
                  </q-item>
                  <q-item
                    clickable
                    @click=" encaminharMensagem(mensagem) "
                  >
                    <q-item-section>Encaminhar</q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    @click=" marcarMensagensParaEncaminhar(mensagem) "
                  >
                    <q-item-section>Marcar (encaminhar várias)</q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    @click="
                          mensagemReacao = mensagem
                          modalEmojiOpen = true
                        "
                    v-if="
                          ticketFocado.channel &&
                          ['whatsapp'].includes(
                            ticketFocado.channel
                          )
                        "
                  >
                    <q-item-section>Reagir</q-item-section>
                  </q-item>

                  <q-item
                    @click=" AbrirmodaleditarMensagem(mensagem) "
                    clickable
                    v-if=" mensagem.fromMe  && mensagem.mediaType === 'chat'"
                    :disable="ticketFocado.channel === 'messenger'"
                  >
                    <q-item-section>
                      <q-item-label>Editar Mensagem</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-separator />
                  <q-item
                    @click=" deletarMensagem(mensagem) "
                    clickable
                    v-if=" mensagem.fromMe "
                    :disable=" isDesactivatDelete(mensagem) || ticketFocado.channel === 'messenger' "
                  >
                    <q-item-section>
                      <q-item-label>Deletar</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <q-icon
              v-if="mensagem.fromMe && mensagem.mediaType !== 'reaction'"
              class="absolute-bottom-right q-pr-xs q-pb-xs"
              :name=" ackIcons[mensagem.ack] "
              size="1.2em"
              :color=" mensagem.ack >= 3 ? 'blue-12' : '' "
            />
            <template v-if="mensagem.mediaType === 'audio'">
              <AudioVisualizer
                :url="mensagem.mediaUrl"
                :contact="mensagem.contact"
                :fromMe="mensagem.fromMe"
                :avatar-src="mensagem.fromMe ? $store.state.usuario?.profileImage : mensagem.contact?.profilePicUrl"
              />
            </template>
            <template v-if=" mensagem.mediaType === 'vcard' ">
              <div style="min-width: 250px;">
                <ContatoCard
                  :mensagem="mensagem"
                  @openContactModal="openContactModal"
                />
                <ContatoModal
                  :value="modalContato"
                  :contact="currentContact"
                  @close="closeModal"
                  @saveContact="saveContact"
                />
              </div>
            </template>
            <template v-if="mensagem.mediaType === 'location'">
              <q-img
                @click=" urlMedia = mensagem.mediaUrl; abrirModalImagem = false "
                src="../../assets/localizacao.png"
                spinner-color="primary"
                height="150px"
                width="330px"
                class="q-mt-md"
                style="cursor: pointer;"
              />
              <VueEasyLightbox moveDisabled :visible="abrirModalImagem" :imgs="urlMedia" :index="mensagem.ticketId || 1" @hide="abrirModalImagem = false" />
            </template>
            <template v-if=" mensagem.mediaType === 'image' ">
              <!-- @click="buscarImageCors(mensagem.mediaUrl)" -->
              <q-img
                @click=" urlMedia = mensagem.mediaUrl; abrirModalImagem = true "
                :src=" mensagem.mediaUrl "
                spinner-color="primary"
                height="150px"
                width="330px"
                class="q-mt-md"
                style="cursor: pointer;"
              />
              <VueEasyLightbox
                moveDisabled
                :visible=" abrirModalImagem "
                :imgs=" urlMedia "
                :index=" mensagem.ticketId || 1 "
                @hide=" abrirModalImagem = false "
              />
            </template>
            <template v-if=" mensagem.mediaType === 'video' ">
              <video
                :src=" mensagem.mediaUrl "
                controls
                class="q-mt-md"
                style="objectFit: cover;
                  width: 330px;
                  height: 150px;
                  borderTopLeftRadius: 8px;
                  borderTopRightRadius: 8px;
                  borderBottomLeftRadius: 8px;
                  borderBottomRightRadius: 8px;
                "
              >
              </video>
            </template>
            <div v-if="mensagem.mediaType === 'reaction'" class="reaction-container q-mt-xs">
              {{ mensagem.body }}
            </div>
            <template v-if=" !['audio', 'vcard', 'image', 'video'].includes(mensagem.mediaType) && mensagem.mediaUrl ">
              <div class="text-center full-width hide-scrollbar no-scroll">
                <iframe
                  v-if=" isPDF(mensagem.mediaUrl) "
                  frameBorder="0"
                  scrolling="no"
                  style="
                    width: 330px;
                    height: 150px;
                    overflow-y: hidden;
                    -ms-overflow-y: hidden;
                  "
                  class="no-scroll hide-scrollbar"
                  :src=" mensagem.mediaUrl "
                  id="frame-pdf"
                >
                  Faça download do PDF
                  <!-- alt : <a href="mensagem.mediaUrl"></a> -->
                </iframe>
                <q-btn
                  type="a"
                  :color=" $q.dark.isActive ? '' : 'grey-3' "
                  no-wrap
                  no-caps
                  stack
                  dense
                  class="q-mt-sm text-center text-black btn-rounded  text-grey-9 ellipsis"
                  download
                  :target=" isPDF(mensagem.mediaUrl) ? '_blank' : '' "
                  :href=" mensagem.mediaUrl "
                >
                  <q-tooltip
                    v-if=" mensagem.mediaUrl "
                    content-class="text-bold"
                  >
                    Baixar: {{ mensagem.mediaName }}
                    {{ mensagem.body }}
                  </q-tooltip>
                  <div class="row items-center q-ma-xs ">
                    <div
                      class="ellipsis col-grow q-pr-sm"
                      style="max-width: 290px"
                    >
                      {{ farmatarMensagemWhatsapp(mensagem.body || mensagem.mediaName) }}
                    </div>
                    <q-icon name="mdi-download" />
                  </div>
                </q-btn>
              </div>
            </template>
            <div
              v-linkified
              v-if=" !['vcard', 'application', 'audio', 'reaction'].includes(mensagem.mediaType) "
              :class=" { 'q-mt-sm': mensagem.mediaType !== 'chat' } "
              class="q-message-container row items-end no-wrap"
            >
              <div v-html=" farmatarMensagemWhatsapp(mensagem.body) ">
              </div>
            </div>
          </div>
        </q-chat-message>
      </template>
    </transition-group>

    <q-dialog v-model="modalEmojiOpen">
      <q-card>
        <q-card-section class="row q-gutter-sm">
          <q-btn
            v-for="emoji in principaisEmojis"
            :key="emoji"
            flat
            @click="selectEmoji(emoji, mensagemReacao)"
          >
            {{ emoji }}
          </q-btn>

          <!-- Botão circular com o ícone "+" -->
          <q-btn
            flat
            round
            icon="add"
            size="sm"
            class="q-ml-sm"
            @click="expandirEmojis = !expandirEmojis"
          />

          <div v-if="expandirEmojis">
            <VEmojiPicker
              style="width: 40vw"
              :showSearch="true"
              :emojisByRow="calculateEmojisByRow()"
              lang="pt-BR"
              @select="onInsertSelectEmoji"
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showModaledit">
      <q-card>
        <q-card-section>
          <div class="text-h6">Editar Mensagem</div>
        </q-card-section>
        <q-card-section>
          <q-input filled v-model="mensagemAtual.body" label="Mensagem" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="Cancelar" color="negative" v-close-popup />
          <q-btn label="Salvar" color="primary" @click="salvarMensagem" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import mixinCommon from './mixinCommon'
import axios from 'axios'
import VueEasyLightbox from 'vue-easy-lightbox'
import MensagemRespondida from './MensagemRespondida'
import ContatoCard from './ContatoCard.vue'
import ContatoModal from './ContatoModal.vue'
import AudioVisualizer from '../../components/AudioVisualizer.vue'
import { VEmojiPicker } from 'v-emoji-picker'
const downloadImageCors = axios.create({
  baseURL: process.env.VUE_URL_API,
  timeout: 20000,
  headers: {
    responseType: 'blob'
  }
})
import { DeletarMensagem, EditarMensagem, ReagirMensagem } from 'src/service/tickets'
import { Base64 } from 'js-base64'
export default {
  name: 'MensagemChat',
  mixins: [mixinCommon],
  props: {
    mensagem: {
      type: Object,
      required: true
    },
    mensagens: {
      type: Array,
      default: () => []
    },
    mensagensParaEncaminhar: {
      type: Array,
      default: () => []
    },
    size: {
      type: [String, Number],
      default: '5'
    },
    isLineDate: {
      type: Boolean,
      default: true
    },
    isShowOptions: {
      type: Boolean,
      default: true
    },
    ativarMultiEncaminhamento: {
      type: Boolean,
      default: false
    },
    replyingMessage: {
      type: Object,
      default: () => { }
    }
  },
  data () {
    return {
      modalContato: false,
      modalEmojiOpen: false,
      mensagemReacao: null,
      expandirEmojis: false,
      principaisEmojis: ['👍', '❤️', '😂', '😮', '😢', '👏'],
      currentContact: {},
      mensagemAtual: { body: '' },
      showModaledit: false,
      abrirModalImagem: false,
      urlMedia: '',
      identificarMensagem: null,
      ackIcons: { // Se ACK == 3 ou 4 entao color green
        0: 'mdi-clock-outline',
        1: 'mdi-check',
        2: 'mdi-check-all',
        3: 'mdi-check-all',
        4: 'mdi-check-all'
      }
    }
  },
  components: {
    VueEasyLightbox,
    MensagemRespondida,
    ContatoCard,
    ContatoModal,
    AudioVisualizer,
    VEmojiPicker
  },
  methods: {
    openContactModal (contact) {
      this.currentContact = contact
      this.modalContato = true
    },
    closeModal () {
      this.modalContato = false
    },
    saveContact (contact) {
      console.log('Contato salvo:', contact)
      // Aqui você pode adicionar a lógica para salvar o contato
    },
    async salvarMensagem () {
      try {
        const updatedMessage = await EditarMensagem({
          id: this.mensagemAtual.id,
          messageId: this.mensagemAtual.messageId,
          body: this.mensagemAtual.body
        })
        console.log('Mensagem editada com sucesso')
        this.showModaledit = false
        this.atualizarMensagem(updatedMessage)
      } catch (error) {
        console.error('Erro ao editar a mensagem', error.message)
        this.$notificarErro('Não foi possível editar a mensagem')
      }
    },
    atualizarMensagem (updatedMessage) {
      const index = this.mensagens.findIndex(mensagem => mensagem.id === updatedMessage.id)
      if (index !== -1) {
        this.mensagens.splice(index, 1, updatedMessage)
      }
    },
    AbrirmodaleditarMensagem (mensagem) {
      this.mensagemAtual = mensagem
      this.showModaledit = true
    },
    async selectEmoji (emoji, mensagem) {
      if (mensagem) {
        const reactionData = {
          messageId: mensagem.messageId,
          ticketId: mensagem.ticketId,
          reaction: emoji
        }
        await ReagirMensagem(reactionData)
        this.mensagem = null
      } else {
        console.error('Nenhuma mensagem foi selecionada para reação.')
      }
      this.modalEmojiOpen = false
    },
    calculateEmojisByRow () {
      const screenWidth = window.innerWidth
      if (screenWidth < 600) {
        return 5
      } else if (screenWidth >= 600 && screenWidth < 1200) {
        return 10
      } else {
        return 20
      }
    },
    onInsertSelectEmoji (emoji) {
      if (this.mensagemReacao) {
        const reactionData = {
          messageId: this.mensagemReacao.messageId,
          ticketId: this.mensagemReacao.ticketId,
          reaction: emoji.data
        }
        this.selectEmoji(reactionData.reaction, this.mensagemReacao)
      } else {
        console.error('Nenhuma mensagem foi selecionada para reação.')
      }
      this.modalEmojiOpen = false
    },
    verificarEncaminharMensagem (mensagem) {
      const mensagens = [...this.mensagensParaEncaminhar]
      const msgIdx = mensagens.findIndex(m => m.id === mensagem.id)
      if (msgIdx !== -1) {
        mensagens.splice(msgIdx, 1)
      } else {
        if (this.mensagensParaEncaminhar.length > 9) {
          this.$notificarErro('Permitido no máximo 10 mensagens.')
          return
        }
        mensagens.push(mensagem)
      }
      this.$refs[`box-chat-message-${mensagem.id}`][0].value = !this.$refs[`box-chat-message-${mensagem.id}`][0].value
      this.$emit('update:mensagensParaEncaminhar', mensagens)
    },
    marcarMensagensParaEncaminhar (mensagem) {
      this.$emit('update:mensagensParaEncaminhar', [])
      this.$emit('update:ativarMultiEncaminhamento', !this.ativarMultiEncaminhamento)
      // this.verificarEncaminharMensagem(mensagem)
    },
    isPDF (url) {
      if (!url) return false
      const split = url.split('.')
      const ext = split[split.length - 1]
      return ext === 'pdf'
    },
    isGroupLabel (mensagem) {
      try {
        return this.ticketFocado.isGroup ? mensagem.contact.name : ''
      } catch (error) {
        return ''
      }
    },
    // cUrlMediaCors () {
    //   return this.urlMedia
    // },
    returnCardContato (str) {
      // return btoa(str)
      return Base64.encode(str)
    },
    isDesactivatDelete (msg) {
      return false
    },
    async buscarImageCors (imageUrl) {
      this.loading = true
      try {
        const { data, headers } = await downloadImageCors.get(imageUrl, {
          responseType: 'blob'
        })
        const url = window.URL.createObjectURL(
          new Blob([data], { type: headers['content-type'] })
        )
        this.urlMedia = url
        this.abrirModalImagem = true
      } catch (error) {
        this.$notificarErro('Ocorreu um erro!', error)
      }
      this.loading = false
    },
    citarMensagem (mensagem) {
      this.$emit('update:replyingMessage', mensagem)
      this.$root.$emit('mensagem-chat:focar-input-mensagem', mensagem)
    },
    encaminharMensagem (mensagem) {
      this.$emit('mensagem-chat:encaminhar-mensagem', mensagem)
    },
    deletarMensagem (mensagem) {
      if (this.isDesactivatDelete(mensagem)) {
        this.$notificarErro('Não foi possível apagar mensagem com mais de 5min do envio.')
      }
      const data = { ...mensagem }
      this.$q.dialog({
        title: 'Atenção!! Deseja realmente deletar a mensagem? ',
        message: 'Mensagens antigas não serão apagadas no cliente.',
        cancel: {
          label: 'Não',
          color: 'primary',
          push: true
        },
        ok: {
          label: 'Sim',
          color: 'negative',
          push: true
        },
        persistent: true
      }).onOk(() => {
        this.loading = true
        DeletarMensagem(data)
          .then((res) => {
            this.loading = false
            mensagem.isDeleted = true
          })
          .catch(error => {
            this.loading = false
            console.error(error)
            this.$notificarErro('Não foi possível apagar a mensagem', error)
          })
      }).onCancel(() => {
      })
    },
    focarMensagem (mensagem) {
      const id = `chat-message-${mensagem.id}`
      this.identificarMensagem = id
      this.$nextTick(() => {
        const elem = document.getElementById(id)
        elem.scrollIntoView()
      })
      setTimeout(() => {
        this.identificarMensagem = null
      }, 5000)
    }
  },
  mounted () {
    this.scrollToBottom()
  },
  destroyed () {
  }
}
</script>

<style lang="scss">
.frame-pdf {
  overflow: hidden;
}

.checkbox-encaminhar-right {
  right: -35px;
  z-index: 99999;
}

.checkbox-encaminhar-left {
  left: -35px;
  z-index: 99999;
}

.reaction-container {
  font-size: 0.75rem;
  color: #606060;
  margin-top: 8px;
  padding: 2px 4px;
  border-radius: 4px;
  background-color: #f0f0f0;
  display: inline-block;
}
</style>
