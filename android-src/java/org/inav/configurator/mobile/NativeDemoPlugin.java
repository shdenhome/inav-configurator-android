package org.inav.configurator.mobile;

import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.InputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Runs the same INAV 10 SITL firmware used by the desktop demo, locally. */
@CapacitorPlugin(name = "NativeDemo")
public class NativeDemoPlugin extends Plugin {
    private final ExecutorService tasks = Executors.newSingleThreadExecutor();
    private volatile Process process;
    private volatile Socket socket;
    private volatile boolean destroyed;
    private volatile String lastOutput = "";

    @PluginMethod
    public void start(PluginCall call) {
        tasks.execute(() -> {
            try {
                if (destroyed) throw new IllegalStateException("Activity has been destroyed");
                stopInternal();
                File executable = new File(getContext().getApplicationInfo().nativeLibraryDir, "libinav_demo.so");
                if (!executable.canExecute()) throw new IllegalStateException("Demo executable is unavailable for this CPU");
                File eeprom = new File(getContext().getFilesDir(), "inav-demo-10.bin");
                Process child = new ProcessBuilder(executable.getAbsolutePath(), "--path=" + eeprom.getAbsolutePath())
                    .directory(getContext().getFilesDir()).redirectErrorStream(true).start();
                process = child;
                lastOutput = "";
                Thread logReader = new Thread(() -> {
                    try (InputStream in = child.getInputStream()) {
                        byte[] buffer = new byte[1024];
                        int n;
                        while ((n = in.read(buffer)) != -1) {
                            String text = lastOutput + new String(buffer, 0, n, java.nio.charset.StandardCharsets.UTF_8);
                            lastOutput = text.substring(Math.max(0, text.length() - 8192));
                            JSObject output = new JSObject();
                            output.put("message", new String(buffer, 0, n, java.nio.charset.StandardCharsets.UTF_8));
                            notifyListeners("output", output);
                        }
                    } catch (Exception ignored) { }
                }, "inav-demo-log");
                logReader.setDaemon(true);
                logReader.start();
                call.resolve();
            } catch (Exception e) {
                stopInternal();
                call.reject("Unable to start demo: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void connect(PluginCall call) {
        tasks.execute(() -> {
            try {
                closeSocket();
                // The demo is deliberately restricted to its local MSP socket.
                Exception lastError = null;
                Socket connected = null;
                for (int attempt = 0; attempt < 100 && !destroyed; attempt++) {
                    if (process == null || !process.isAlive()) throw new IllegalStateException("Demo exited (code " + (process == null ? "no process" : process.exitValue()) + "). " + lastOutput);
                    Socket candidate = new Socket();
                    try {
                        candidate.connect(new InetSocketAddress("127.0.0.1", 5760), 150);
                        candidate.setTcpNoDelay(true);
                        connected = candidate;
                        break;
                    } catch (Exception e) {
                        lastError = e;
                        candidate.close();
                        Thread.sleep(100);
                    }
                }
                if (connected == null) throw new IllegalStateException("Demo did not become ready. Socket: " + (lastError == null ? "none" : lastError.toString()) + ". Process alive: " + (process != null && process.isAlive()) + ". Output:\n" + lastOutput, lastError);
                socket = connected;
                Socket session = connected;
                Thread reader = new Thread(() -> {
                    try {
                        byte[] buffer = new byte[16384];
                        int n;
                        InputStream in = session.getInputStream();
                        while ((n = in.read(buffer)) != -1 && socket == session) {
                            JSObject data = new JSObject();
                            data.put("data", Base64.encodeToString(buffer, 0, n, Base64.NO_WRAP));
                            notifyListeners("data", data);
                        }
                    } catch (Exception ignored) { }
                    finally {
                        if (socket == session) {
                            closeSocket();
                            JSObject detail = new JSObject();
                            Process child = process;
                            detail.put("message", "Demo connection closed. Exit=" +
                                (child == null ? "no process" : child.isAlive() ? "still running" : child.exitValue()) +
                                ". " + lastOutput);
                            notifyListeners("failure", detail);
                            notifyListeners("end", new JSObject());
                        }
                    }
                }, "inav-demo-msp");
                reader.setDaemon(true);
                reader.start();
                JSObject result = new JSObject();
                result.put("id", "android-demo");
                call.resolve(result);
            } catch (Exception e) {
                closeSocket();
                call.reject("Unable to connect to demo: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void send(PluginCall call) {
        tasks.execute(() -> {
            try {
                Socket session = socket;
                if (session == null) throw new IllegalStateException("Demo is not connected");
                byte[] bytes = Base64.decode(call.getString("data", ""), Base64.DEFAULT);
                session.getOutputStream().write(bytes);
                JSObject result = new JSObject();
                result.put("bytesWritten", bytes.length);
                call.resolve(result);
            } catch (Exception e) { call.reject(e.getMessage()); }
        });
    }

    @PluginMethod
    public void close(PluginCall call) {
        tasks.execute(() -> { closeSocket(); call.resolve(); });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        tasks.execute(() -> { stopInternal(); call.resolve(); });
    }

    private synchronized void closeSocket() {
        Socket current = socket;
        socket = null;
        if (current != null) try { current.close(); } catch (Exception ignored) { }
    }

    private synchronized void stopInternal() {
        closeSocket();
        Process child = process;
        process = null;
        if (child != null) {
            child.destroyForcibly();
            try { child.waitFor(500, java.util.concurrent.TimeUnit.MILLISECONDS); }
            catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
    }

    @Override
    protected void handleOnDestroy() {
        destroyed = true;
        stopInternal();
        tasks.shutdownNow();
    }
}
