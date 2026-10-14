package com.example

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.viewinterop.AndroidView
import java.io.InputStream

class MainActivity : ComponentActivity() {

  private var filePathCallback: ValueCallback<Array<Uri>>? = null

  private val filePickerLauncher = registerForActivityResult(
    ActivityResultContracts.StartActivityForResult()
  ) { result ->
    val intent = result.data
    val results: Array<Uri>? = if (result.resultCode == Activity.RESULT_OK && intent != null) {
      val clipData = intent.clipData
      if (clipData != null && clipData.itemCount > 0) {
        val list = mutableListOf<Uri>()
        for (i in 0 until clipData.itemCount) {
          list.add(clipData.getItemAt(i).uri)
        }
        list.toTypedArray()
      } else if (intent.data != null) {
        arrayOf(intent.data!!)
      } else {
        null
      }
    } else {
      null
    }

    filePathCallback?.onReceiveValue(results)
    filePathCallback = null
  }

  private fun launchFileChooser(
    callback: ValueCallback<Array<Uri>>?,
    params: WebChromeClient.FileChooserParams?
  ): Boolean {
    filePathCallback?.onReceiveValue(null)
    filePathCallback = callback

    val intent = try {
      params?.createIntent() ?: Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
        type = "application/pdf"
        addCategory(Intent.CATEGORY_OPENABLE)
        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
      }
    } catch (e: Exception) {
      Intent(Intent.ACTION_GET_CONTENT).apply {
        type = "application/pdf"
        addCategory(Intent.CATEGORY_OPENABLE)
        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
      }
    }

    return try {
      filePickerLauncher.launch(intent)
      true
    } catch (e: Exception) {
      Log.e("VedoraPicker", "Failed to launch document picker", e)
      filePathCallback?.onReceiveValue(null)
      filePathCallback = null
      false
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    setContent {
      VedoraHost(onShowFileChooser = ::launchFileChooser)
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun VedoraHost(
  onShowFileChooser: ((ValueCallback<Array<Uri>>?, WebChromeClient.FileChooserParams?) -> Boolean)? = null
) {
  var webViewInstance by remember { mutableStateOf<WebView?>(null) }
  var canGoBack by remember { mutableStateOf(false) }

  BackHandler(enabled = canGoBack) {
    webViewInstance?.goBack()
  }

  Box(
    modifier = Modifier
      .fillMaxSize()
      .background(ComposeColor(0xFFF2EFE9))
      .systemBarsPadding()
  ) {
    AndroidView(
      modifier = Modifier.fillMaxSize(),
      factory = { context ->
        WebView(context).apply {
          layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
          )
          setBackgroundColor(Color.parseColor("#F2EFE9"))

          settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
          }

          webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
              view: WebView?,
              request: WebResourceRequest?
            ): WebResourceResponse? {
              val uri = request?.url ?: return null
              val host = uri.host ?: ""

              if (host.equals("vedora.local", ignoreCase = true) || host.equals("localhost", ignoreCase = true)) {
                return serveAsset(context, uri)
              }

              return super.shouldInterceptRequest(view, request)
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
              super.onPageStarted(view, url, favicon)
              canGoBack = view?.canGoBack() == true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
              super.onPageFinished(view, url)
              canGoBack = view?.canGoBack() == true
            }

            override fun onReceivedError(
              view: WebView?,
              request: WebResourceRequest?,
              error: WebResourceError?
            ) {
              super.onReceivedError(view, request, error)
              Log.e("VedoraWebView", "Error loading ${request?.url}: ${error?.description}")
            }
          }

          webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
              Log.d("VedoraJS", "[${consoleMessage?.messageLevel()}] ${consoleMessage?.message()} -- line ${consoleMessage?.lineNumber()}")
              return true
            }

            override fun onShowFileChooser(
              view: WebView?,
              filePathCallback: ValueCallback<Array<Uri>>?,
              fileChooserParams: FileChooserParams?
            ): Boolean {
              if (onShowFileChooser != null) {
                return onShowFileChooser(filePathCallback, fileChooserParams)
              }
              return super.onShowFileChooser(view, filePathCallback, fileChooserParams)
            }
          }

          loadUrl("https://vedora.local/index.html")
          webViewInstance = this
        }
      },
      update = {
        webViewInstance = it
        canGoBack = it.canGoBack()
      }
    )
  }
}

private fun serveAsset(context: Context, uri: Uri): WebResourceResponse? {
  val rawPath = uri.path?.trimStart('/') ?: ""
  val cleanPath = when {
    rawPath.isEmpty() || rawPath == "index.html" -> "www/index.html"
    else -> "www/$rawPath"
  }

  val mimeType = when {
    cleanPath.endsWith(".html", ignoreCase = true) -> "text/html"
    cleanPath.endsWith(".js", ignoreCase = true) || cleanPath.endsWith(".mjs", ignoreCase = true) -> "application/javascript"
    cleanPath.endsWith(".css", ignoreCase = true) -> "text/css"
    cleanPath.endsWith(".json", ignoreCase = true) -> "application/json"
    cleanPath.endsWith(".png", ignoreCase = true) -> "image/png"
    cleanPath.endsWith(".jpg", ignoreCase = true) || cleanPath.endsWith(".jpeg", ignoreCase = true) -> "image/jpeg"
    cleanPath.endsWith(".svg", ignoreCase = true) -> "image/svg+xml"
    cleanPath.endsWith(".webp", ignoreCase = true) -> "image/webp"
    cleanPath.endsWith(".pdf", ignoreCase = true) -> "application/pdf"
    cleanPath.endsWith(".ttf", ignoreCase = true) || cleanPath.endsWith(".pfb", ignoreCase = true) -> "font/ttf"
    cleanPath.endsWith(".bcmap", ignoreCase = true) -> "application/octet-stream"
    else -> "application/octet-stream"
  }

  return try {
    val inputStream: InputStream = context.assets.open(cleanPath)
    val headers = mapOf(
      "Access-Control-Allow-Origin" to "*",
      "Access-Control-Allow-Methods" to "GET, OPTIONS",
      "Access-Control-Allow-Headers" to "*"
    )
    WebResourceResponse(mimeType, "UTF-8", 200, "OK", headers, inputStream)
  } catch (e: Exception) {
    Log.w("VedoraAssets", "Asset not found: $cleanPath", e)
    null
  }
}
