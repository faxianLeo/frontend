<template>
  <div>
    <el-popover v-model="visible" placement="left" trigger="click">
      <mobile-capture v-if="initMobileCapture" style="width: 1200px; height: 680px" @closeMobileCapture="visible = false" />
      <el-button slot="reference" :disabled="disable" size="mini" @click="initMobileCapture = true">
        <svg-icon icon-class="capture" />
      </el-button>
    </el-popover>

    <screenshot-viewer />

    <el-button-group>
      <el-button size="mini" icon="el-icon-s-home" :disabled="disable" @click="sendKeycode(3)"></el-button>
      <el-button size="mini" icon="el-icon-back" :disabled="disable" @click="sendKeycode(4)"></el-button>
      <el-button size="mini" icon="el-icon-close" @click="clickClose"></el-button>
      <el-button size="mini" :disabled="disable" :loading="logBtnLoading" @click="startLog">Log</el-button>
    </el-button-group>

    <el-popover placement="left" trigger="click">
      <el-button size="mini" @click="sendKeycode(82)">Menu</el-button>
      <el-button size="mini" @click="sendKeycode(26)">Power</el-button>
      <el-divider />
      <!-- 安装APP -->
      <el-upload drag action="/" :on-change="onChange" :multiple="false" :auto-upload="false">
        <i class="el-icon-upload" /><div>将apk拖到此处，或<em>点击选择apk</em></div>
      </el-upload>
      <el-button :loading="installBtnLoading" type="primary" size="mini" @click="installApp">{{ installBtnText }}</el-button>
      <el-divider />
      <!--开启远程调试-->
      <el-button type="primary" size="mini" @click="startOrStopAdbKit">{{ adbKitBtnText }}</el-button>
      <el-tag v-if="adbKitIsStart" type="success">{{ adbkitTip }}</el-tag>
      <el-divider />
      <!--切换输入法-->
      <el-select v-model="ime" placeholder="切换输入法" style="width: 100%" @visible-change="selectIme" @change="imeSelected">
        <el-option
          v-for="ime in imeList"
          :key="ime.value"
          :label="ime.label"
          :value="ime.value"
        />
      </el-select>
      <el-divider />
      <el-button slot="reference" size="mini" :disabled="disable">...</el-button>
    </el-popover>
  </div>
</template>

<script>
import MobileCapture from '@/pages/mobile/components/MobileCapture'
import { startAdbKit, stopAdbKit, installApp, getImeList, setIme, startLogsBroadcast } from '@/api/agent'
import ScreenshotViewer from '@/pages/mobile/components/ScreenshotViewer'

export default {
  components: {
    ScreenshotViewer,
    MobileCapture
  },
  props: {
    androidWebsocket: WebSocket
  },
  data() {
    return {
      visible: false,
      initMobileCapture: false,
      ime: undefined,
      imeList: [],
      adbKitBtnText: '开启远程调试',
      adbkitTip: '',
      adbKitIsStart: false,
      installBtnLoading: false,
      installBtnText: '安装APP',
      choosedFile: null,
      logBtnLoading: false
    }
  },
  computed: {
    agentIp() {
      return this.$store.state.mobile.agentIp
    },
    agentPort() {
      return this.$store.state.mobile.agentPort
    },
    mobileId() {
      return this.$store.state.mobile.id
    },
    driverSessionId() {
      return this.$store.state.mobile.driverSessionId
    },
    disable() {
      return !this.$store.state.mobile.driverSessionId
    }
  },
  methods: {
    selectIme(type) {
      if (type) {
        this.fetchImeList()
      }
    },
    imeSelected(ime) {
      setIme(this.agentIp, this.agentPort, this.mobileId, ime).then(response => {
        this.$notify.success(response.msg)
      })
    },
    fetchImeList() {
      getImeList(this.agentIp, this.agentPort, this.mobileId).then(response => {
        this.imeList = response.data.map(ime => {
          return { value: ime, label: ime }
        })
      })
    },
    startOrStopAdbKit() {
      if (!this.adbKitIsStart) {
        startAdbKit(this.agentIp, this.agentPort, this.mobileId).then(response => {
          this.adbKitIsStart = true
          this.adbKitBtnText = '关闭远程调试'
          this.adbkitTip = `'adb connect ${this.agentIp}:${response.data.port}`
        })
      } else {
        stopAdbKit(this.agentIp, this.agentPort, this.mobileId).then(() => {
          this.adbKitIsStart = false
          this.adbKitBtnText = '开启远程调试'
          this.adbkitTip = ''
        })
      }
    },
    startLog() {
      this.logBtnLoading = true
      startLogsBroadcast(this.agentIp, this.agentPort, this.mobileId, this.driverSessionId).then(response => {
        const wsUrl = response.data.wsUrl
        this.$router.push({ name: 'Log', params: { wsUrl }})
      }).finally(() => {
        this.logBtnLoading = false
      })
    },
    // 选择apk
    onChange(file) {
      this.choosedFile = file
    },
    // 点击安装APP按钮
    installApp() {
      // 是否选择了一个文件
      if (this.choosedFile == null) {
        this.$notify.error('请选择一个app')
        return
      }
      // 选择的文件是否以apk结尾
      const app = this.choosedFile.raw
      if (!app.name.endsWith('.apk')) {
        this.$notify.error('请选择apk文件')
        return
      }

      this.installBtnText = '安装中...'
      this.installBtnLoading = true
      const form = new FormData()
      form.append('app', app)
      installApp(this.agentIp, this.agentPort, this.mobileId, form).then(response => {
        this.$notify.success(response.msg)
      }).finally(() => {
        this.installBtnText = '安装APP'
        this.installBtnLoading = false
      })
    },
    sendKeycode(keycode) {
      this.androidWebsocket.send(JSON.stringify({
        operation: 'k',
        keycode
      }))
    },
    clickClose() {
      this.$emit('onClickClose')
      this.closeBoard()
    },
    closeBoard() {
      this.$store.dispatch('mobile/setShow', false) // AppMain.vue在v-if销毁右侧控制组件
    }
  }
}
</script>
