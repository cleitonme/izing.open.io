<template>
  <q-dialog
    :value="modalWhatsapp"
    @hide="fecharModal"
    @show="abrirModal"
    persistent
  >
    <q-card
      class="q-pa-md"
      style="width: 500px"
    >
      <q-card-section>
        <div class="text-h6">
          <q-icon
            size="50px"
            class="q-mr-md"
            :name="whatsapp.type ? `img:${whatsapp.type}-logo.png` : 'mdi-alert'"
          /> {{ whatsapp.id ? 'Editar' :
              'Adicionar'
            }}
          Canal
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row">
          <div class="col-12 q-my-sm">
            <q-select
              :disable="!!whatsapp.id"
              v-model="whatsapp.type"
              :options="optionsWhatsappsTypes"
              label="Tipo"
              emit-value
              map-options
              outlined
              rounded
              dense
            />
          </div>
          <div class="col-12">
            <c-input
              outlined
              rounded
              label="Nome"
              dense
              v-model="whatsapp.name"
              :validator="$v.whatsapp.name"
              @blur="$v.whatsapp.name.$touch"
            />
          </div>

          <div class="col-12 q-my-sm" v-if="whatsapp.type === 'hub'">
            <q-select v-model="selectedHubOption"
              rounded
              outlined
              dense
              :options="hubOptions"
              label="Selecione um Hub"
              filled />
          </div>
          <div
            class="col-12 q-mt-md"
            v-if="whatsapp.type === 'telegram'"
          >
            <c-input
              outlined
              dense
              label="Token Telegram"
              v-model="whatsapp.tokenTelegram"
            />
          </div>
          <div
            class="q-mt-md row full-width justify-center"
            v-if="whatsapp.type === 'instagram'"
          >
            <div class="col">
              <fieldset class="full-width q-pa-md rounded-all">
                <legend>Dados da conta do Instagram</legend>
                <div
                  class="col-12 q-mb-md"
                  v-if="whatsapp.type === 'instagram'"
                >
                  <c-input
                    outlined
                    dense
                    label="Usuário"
                    v-model="whatsapp.instagramUser"
                    hint="Seu usuário do Instagram (sem @)"
                  />
                </div>
                <div
                  v-if="whatsapp.type === 'instagram' && !isEdit"
                  class="text-center"
                >
                  <q-btn
                    color="positive"
                    icon="edit"
                    label="Nova senha"
                    @click="isEdit = !isEdit"
                  >
                    <q-tooltip>
                      Alterar senha
                    </q-tooltip>
                  </q-btn>
                </div>
                <div
                  class="col-12"
                  v-if="whatsapp.type === 'instagram' && isEdit"
                >
                  <c-input
                    outlined
                    rounded
                    label="Senha"
                    :type="isPwd ? 'password' : 'text'"
                    v-model="whatsapp.instagramKey"
                    hint="Senha utilizada para logar no Instagram"
                    placeholder="*************"
                    :disable="!isEdit"
                  >
                    <template v-slot:after>
                      <q-btn
                        class="bg-padrao"
                        round
                        flat
                        color="negative"
                        icon="mdi-close"
                        @click="isEdit = !isEdit"
                      >
                        <q-tooltip>
                          Cancelar alteração de senha
                        </q-tooltip>

                      </q-btn>
                    </template>
                    <template v-slot:append>
                      <q-icon
                        :name="isPwd ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="isPwd = !isPwd"
                      />
                    </template>
                  </c-input>
                </div>
              </fieldset>

            </div>
          </div>
        </div>

        <div class="row q-my-md" v-if="!whatsapp?.type?.includes('hub')">
          <div class="col-12 relative-position">
            <label class="text-caption">Mensagem Despedida:
            </label>
            <textarea
              ref="inputFarewellMessage"
              style="min-height: 15vh; max-height: 15vh;"
              class="q-pa-sm rounded-all bg-white full-width"
              placeholder="Digite a mensagem"
              autogrow
              dense
              outlined
              v-model="whatsapp.farewellMessage"
            >
            </textarea>
            <div class="absolute-top-right">
              <q-btn
                rounded
                dense
                color="black"
                style="margin-bottom: -120px; margin-right: -30px"
              >
              <q-icon
                size="1.5em"
                name="mdi-emoticon-happy-outline"
              />
              <q-tooltip>
                Emoji
              </q-tooltip>
              <q-menu
                anchor="top right"
                self="bottom middle"
                :offset="[5, 40]"
              >
                <VEmojiPicker
                  style="width: 40vw"
                  :showSearch="false"
                  :emojisByRow="20"
                  labelSearch="Localizar..."
                  lang="pt-BR"
                  @select="onInsertSelectEmoji"
                />
              </q-menu>
            </q-btn>
              <q-btn
                rounded
                dense
                color="black"
                style="margin-bottom: -40px; margin-right: -10px"
              >
                <q-icon
                  size="1.5em"
                  name="mdi-variable"
                />
                <q-tooltip>
                  Variáveis
                </q-tooltip>
                <q-menu touch-position>
                  <q-list
                    dense
                    style="min-width: 100px"
                  >
                    <q-item
                      v-for="variavel in variaveis"
                      :key="variavel.label"
                      clickable
                      @click="onInsertSelectVariable(variavel.value)"
                      v-close-popup
                    >
                      <q-item-section>{{ variavel.label }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>
        </div>
        <div class="col-12" v-if="whatsapp.type === 'whatsapp'">
          <div class="row items-center">
            <div class="col-12">
              <label class="text-caption">Use cupom desconto "whazing" - <a href="https://app.wavoip.com/" target="_blank">Visite app.wavoip.com</a></label>
              <c-input outlined
                       label="Wavoip chamadas whatsapp"
                       v-model="whatsapp.wavoip"/>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="center"
        class="q-mt-lg"
      >
        <q-btn
          rounded
          label="Sair"
          class="q-px-md q-mr-lg"
          color="negative"
          v-close-popup
        />
        <q-btn
          label="Salvar"
          color="positive"
          rounded
          class="q-px-md"
          @click="handleSaveWhatsApp(whatsapp)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { required, minLength, maxLength } from 'vuelidate/lib/validators'
import { UpdateWhatsapp, CriarWhatsapp } from 'src/service/sessoesWhatsapp'
import { ListarHub, AdicionarHub } from 'src/service/hub'
import cInput from 'src/components/cInput.vue'
import { copyToClipboard, Notify } from 'quasar'
import { VEmojiPicker } from 'v-emoji-picker'

export default {
  components: { cInput, VEmojiPicker },
  name: 'ModalWhatsapp',
  props: {
    modalWhatsapp: {
      type: Boolean,
      default: false
    },
    whatsAppId: {
      type: Number,
      default: null
    },
    whatsAppEdit: {
      type: Object,
      default: () => { }
    }
  },
  data () {
    return {
      hubOptions: [],
      selectedHubOption: null,
      isPwd: true,
      isEdit: false,
      whatsapp: {
        name: '',
        isDefault: false,
        tokenTelegram: '',
        instagramUser: '',
        instagramKey: '',
        tokenAPI: '',
        type: 'whatsapp',
        farewellMessage: ''
      },
      optionsWhatsappsTypes: [
        { label: 'Whatsapp', value: 'whatsapp' },
        { label: 'Telegram', value: 'telegram' },
        { label: 'Hub Notificame', value: 'hub' }
        // { label: 'Instagram', value: 'instagram' }
      ],
      variaveis: [
        { label: 'Nome', value: '{{name}}' },
        { label: 'Saudação', value: '{{greeting}}' },
        { label: 'Protocolo', value: '{{protocol}}' }
      ]
    }
  },
  validations: {
    whatsapp: {
      name: { required, minLength: minLength(3), maxLength: maxLength(50) },
      isDefault: {}
    }
  },
  computed: {
    cBaseUrlIntegração () {
      return this.whatsapp.UrlMessengerWebHook
    }
  },
  watch: {
    'whatsapp.type' (newType) {
      if (newType === 'hub') {
        this.listarHubOptions()
      }
    }
  },
  methods: {
    async listarHubOptions () {
      try {
        const response = await ListarHub()
        this.hubOptions = response.data
          .filter(hub => hub.channel === 'facebook' || hub.channel === 'instagram')
          .map(hub => ({
            label: hub.name,
            value: hub
          }))
      } catch (error) {
        console.error('Erro ao listar Hubs:', error)
      }
    },
    onInsertSelectEmoji (emoji) {
      const self = this
      var tArea = this.$refs.inputFarewellMessage
      // get cursor's position:
      var startPos = tArea.selectionStart,
        endPos = tArea.selectionEnd,
        cursorPos = startPos,
        tmpStr = tArea.value
      // filter:
      if (!emoji.data) {
        return
      }
      // insert:
      self.txtContent = this.whatsapp.farewellMessage
      self.txtContent = tmpStr.substring(0, startPos) + emoji.data + tmpStr.substring(endPos, tmpStr.length)
      this.whatsapp.farewellMessage = self.txtContent
      // move cursor:
      setTimeout(() => {
        tArea.selectionStart = tArea.selectionEnd = cursorPos + emoji.data.length
      }, 10)
    },
    copy (text) {
      copyToClipboard(text)
        .then(this.$notificarSucesso('URL de integração copiada!'))
        .catch()
    },

    onInsertSelectVariable (variable) {
      const self = this
      var tArea = this.$refs.inputFarewellMessage
      // get cursor's position:
      var startPos = tArea.selectionStart,
        endPos = tArea.selectionEnd,
        cursorPos = startPos,
        tmpStr = tArea.value
      // filter:
      if (!variable) {
        return
      }
      // insert:
      self.txtContent = this.whatsapp.farewellMessage
      self.txtContent = tmpStr.substring(0, startPos) + variable + tmpStr.substring(endPos, tmpStr.length)
      this.whatsapp.farewellMessage = self.txtContent
      // move cursor:
      setTimeout(() => {
        tArea.selectionStart = tArea.selectionEnd = cursorPos + 1
      }, 10)
    },

    fecharModal () {
      this.whatsapp = {
        name: '',
        isDefault: false
      }
      this.$emit('update:whatsAppEdit', {})
      this.$emit('update:modalWhatsapp', false)
    },
    abrirModal () {
      if (this.whatsAppEdit.id) {
        this.whatsapp = { ...this.whatsAppEdit }
      }
    },
    async handleSaveWhatsApp (whatsapp) {
      this.$v.whatsapp.$touch()
      if (whatsapp.type !== 'hub') {
        if (this.$v.whatsapp.$error) {
          return this.$q.notify({
            type: 'warning',
            progress: true,
            position: 'top',
            message: 'Ops! Verifique os erros...',
            actions: [{
              icon: 'close',
              round: true,
              color: 'white'
            }]
          })
        }
        try {
          if (this.whatsAppEdit.id) {
            await UpdateWhatsapp(this.whatsAppEdit.id, whatsapp)
          } else {
            await CriarWhatsapp(whatsapp)
          }
          this.$q.notify({
            type: 'positive',
            progress: true,
            position: 'top',
            message: `Whatsapp ${this.whatsAppEdit.id ? 'editado' : 'criado'} com sucesso!`,
            actions: [{
              icon: 'close',
              round: true,
              color: 'white'
            }]
          })
          this.$emit('recarregar-lista')
          this.fecharModal()
        } catch (error) {
          console.error(error, error.data.error === 'ERR_NO_PERMISSION_CONNECTIONS_LIMIT')
          if (error.data.error === 'ERR_NO_PERMISSION_CONNECTIONS_LIMIT') {
            Notify.create({
              type: 'negative',
              message: 'Limite de conexões atingida.',
              caption: 'ERR_NO_PERMISSION_CONNECTIONS_LIMIT',
              position: 'top',
              progress: true
            })
          } else {
            console.error(error)
            return this.$q.notify({
              type: 'error',
              progress: true,
              position: 'top',
              message: 'Ops! Verifique os erros... O nome da conexão não pode existir na plataforma, é um identificador único.',
              actions: [{
                icon: 'close',
                round: true,
                color: 'white'
              }]
            })
          }
        }
      } else if (whatsapp.type === 'hub') {
        if (this.$v.whatsapp.$error) {
          return this.$q.notify({
            type: 'warning',
            progress: true,
            position: 'top',
            message: 'Ops! Verifique os erros...',
            actions: [{
              icon: 'close',
              round: true,
              color: 'white'
            }]
          })
        }
        if (!this.selectedHubOption) {
          return this.$q.notify({
            type: 'warning',
            message: 'Por favor, selecione um Hub antes de continuar.',
            position: 'top',
            actions: [{ icon: 'close', round: true, color: 'white' }]
          })
        }
        const selectedHub = this.selectedHubOption.value
        const data = {
          name: this.whatsapp.name,
          status: 'CONNECTED',
          isDefault: false,
          type: 'hub_' + selectedHub.channel,
          wabaId: selectedHub.id,
          number: selectedHub.id,
          profilePic: selectedHub.profile_pic,
          phone: selectedHub
        }

        const payload = {
          channels: [data]
        }
        try {
          const response = await AdicionarHub(payload)
          console.log(response)
          this.$q.notify({
            type: 'positive',
            message: 'Hub adicionado com sucesso!',
            position: 'top'
          })
          this.$emit('recarregar-lista')
          this.fecharModal()
        } catch (error) {
          console.error('Erro ao adicionar o Hub:', error)
          this.$q.notify({
            type: 'negative',
            message: 'Erro ao adicionar o Hub. Por favor, tente novamente.',
            position: 'top'
          })
        }
      }
    }
  },
  destroyed () {
    this.$v.whatsapp.$reset()
  }
}
</script>

<style lang="scss" scoped>
</style>
