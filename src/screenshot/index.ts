import puppeteer, { type Browser } from "puppeteer";

const CHROME_PATH =
  "/home/agent-lead/.cache/puppeteer/chrome/linux-150.0.7871.24/chrome-linux64/chrome";

let browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
  }
  return browser;
}

export interface ScreenshotOptions {
  url: string;
  format?: "png" | "pdf";
  width?: number;
  height?: number;
  fullPage?: boolean;
}

export interface ScreenshotResult {
  buffer: Buffer;
  contentType: string;
}

export async function takeScreenshot(
  options: ScreenshotOptions
): Promise<ScreenshotResult> {
  const {
    url,
    format = "png",
    width = 1280,
    height = 800,
    fullPage = false,
  } = options;

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error(
      `URL must use http or https protocol, got: ${parsedUrl.protocol}`
    );
  }

  // Retry once if the browser has disconnected (newPage throws)
  let page;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const browserInstance = await getBrowser();
      page = await browserInstance.newPage();
      break;
    } catch {
      // Browser disconnected — reset and relaunch on next attempt
      browser = null;
      if (attempt === 1) {
        throw new Error(
          "Browser connection failed. Please try again."
        );
      }
    }
  }

  try {
    await page!.setViewport({ width, height });

    await page!.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    if (format === "pdf") {
      const pdfOpts: Record<string, unknown> = {
        format: "A4",
        printBackground: true,
      };
      if (!fullPage) {
        pdfOpts.width = `${width}px`;
        pdfOpts.height = `${height}px`;
      }
      const pdfBuffer = await page!.pdf(pdfOpts);
      return {
        buffer: Buffer.from(pdfBuffer),
        contentType: "application/pdf",
      };
    }

    const imageBuffer = await page!.screenshot({
      type: "png",
      fullPage,
    });
    return {
      buffer: Buffer.from(imageBuffer),
      contentType: "image/png",
    };
  } catch (error: unknown) {
    const err = error as Error & { name?: string };
    if (err.name === "TimeoutError") {
      throw new Error(`Timeout loading URL: ${url}`);
    }
    throw new Error(`Screenshot failed: ${err.message}`);
  } finally {
    await page?.close().catch(() => {});
  }
}
