import { prisma } from "@/lib/prisma";
import { maskPayload } from "@/lib/crypto";
import { withResilience } from "@/lib/circuitBreaker";

// Mock integration layer.
// Represents the boundary where EPPB would talk to eGov IDP, ЭЦП, subsidiary BPM systems
// and the Holding's Единая интеграционная шина (ESB) in production.
// Every call is logged so the admin panel can demonstrate integration-readiness
// even though no real external system is connected during the competition.
//
// Every connector is wrapped in withResilience() (retry with backoff + circuit breaker) —
// today the mocks never fail on their own, but /admin/integrations exposes a per-connector
// "simulate outage" toggle so the retry/breaker/degradation behavior is actually demonstrable,
// not just theoretical.

async function log(connector: string, direction: "request" | "response", payload: Record<string, unknown>, status: "ok" | "error") {
  await prisma.integrationLog.create({
    data: {
      connector,
      direction,
      // ИИН/БИН and contact details never hit the log table unmasked, even in this mock layer —
      // the point is that swapping mocks for real connectors later doesn't accidentally start leaking PII.
      payload: JSON.stringify(maskPayload(payload)),
      status,
    },
  });
}

export async function mockEgovIdpLookup(iin: string) {
  await log("egov_idp", "request", { iin }, "ok");
  try {
    const response = await withResilience("egov_idp", async () => ({
      iin,
      fullName: "Тестов Тест Тестович",
      verified: true,
      source: "eGov IDP (mock)",
    }));
    await log("egov_idp", "response", response, "ok");
    return response;
  } catch (err) {
    await log("egov_idp", "response", { error: String(err) }, "error");
    throw err;
  }
}

export async function mockIinBinCheck(value: string) {
  await log("iin_bin_check", "request", { value }, "ok");
  try {
    const response = await withResilience("iin_bin_check", async () => {
      const isBin = value.length === 12 && value.startsWith("9");
      return {
        value,
        type: isBin ? "BIN" : "IIN",
        valid: value.length === 12,
        companyName: isBin ? "ТОО \"Демо Компания\"" : undefined,
        source: "ГБД ЮЛ/ФЛ (mock)",
      };
    });
    await log("iin_bin_check", "response", response, "ok");
    return response;
  } catch (err) {
    await log("iin_bin_check", "response", { error: String(err) }, "error");
    throw err;
  }
}

export async function mockEsignSign(documentName: string) {
  await log("esign", "request", { documentName }, "ok");
  try {
    const response = await withResilience("esign", async () => ({
      documentName,
      signed: true,
      signatureId: `ESIGN-${Date.now()}`,
      signedAt: new Date().toISOString(),
      source: "НУЦ ЭЦП (mock)",
    }));
    await log("esign", "response", response, "ok");
    return response;
  } catch (err) {
    await log("esign", "response", { error: String(err) }, "error");
    throw err;
  }
}

export async function mockBpmSubmit(applicationNumber: string, organizationCode: string) {
  await log("bpm_submit", "request", { applicationNumber, organizationCode }, "ok");
  try {
    const response = await withResilience("bpm_submit", async () => ({
      applicationNumber,
      bpmCaseId: `BPM-${organizationCode}-${Date.now()}`,
      accepted: true,
      source: `BPM ${organizationCode} (mock)`,
    }));
    await log("bpm_submit", "response", response, "ok");
    return response;
  } catch (err) {
    await log("bpm_submit", "response", { error: String(err) }, "error");
    throw err;
  }
}

export async function mockBpmStatus(applicationNumber: string) {
  await log("bpm_status", "request", { applicationNumber }, "ok");
  try {
    const response = await withResilience("bpm_status", async () => {
      const statuses = ["IN_REVIEW", "ADDITIONAL_INFO_REQUIRED", "APPROVED"];
      return {
        applicationNumber,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        source: "BPM (mock)",
      };
    });
    await log("bpm_status", "response", response, "ok");
    return response;
  } catch (err) {
    await log("bpm_status", "response", { error: String(err) }, "error");
    throw err;
  }
}

export async function mockNotifySend(channel: "sms" | "email", to: string, message: string) {
  const connector = "notify_" + channel;
  await log(connector, "request", { to, message }, "ok");
  try {
    const response = await withResilience(connector, async () => ({ to, delivered: true, source: `Notify ${channel} (mock)` }));
    await log(connector, "response", response, "ok");
    return response;
  } catch (err) {
    await log(connector, "response", { error: String(err) }, "error");
    throw err;
  }
}

export async function mockDocExchange(fileName: string) {
  await log("doc_exchange", "request", { fileName }, "ok");
  try {
    const response = await withResilience("doc_exchange", async () => ({
      fileName,
      stored: true,
      url: `#mock-doc/${encodeURIComponent(fileName)}`,
      source: "Хранилище документов (mock)",
    }));
    await log("doc_exchange", "response", response, "ok");
    return response;
  } catch (err) {
    await log("doc_exchange", "response", { error: String(err) }, "error");
    throw err;
  }
}
