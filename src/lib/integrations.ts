import { prisma } from "@/lib/prisma";

// Mock integration layer.
// Represents the boundary where EPPB would talk to eGov IDP, ЭЦП, subsidiary BPM systems
// and the Holding's Единая интеграционная шина (ESB) in production.
// Every call is logged so the admin panel can demonstrate integration-readiness
// even though no real external system is connected during the competition.

async function log(connector: string, direction: "request" | "response", payload: unknown, status: "ok" | "error") {
  await prisma.integrationLog.create({
    data: {
      connector,
      direction,
      payload: JSON.stringify(payload),
      status,
    },
  });
}

export async function mockEgovIdpLookup(iin: string) {
  await log("egov_idp", "request", { iin }, "ok");
  const response = {
    iin,
    fullName: "Тестов Тест Тестович",
    verified: true,
    source: "eGov IDP (mock)",
  };
  await log("egov_idp", "response", response, "ok");
  return response;
}

export async function mockIinBinCheck(value: string) {
  await log("iin_bin_check", "request", { value }, "ok");
  const isBin = value.length === 12 && value.startsWith("9");
  const response = {
    value,
    type: isBin ? "BIN" : "IIN",
    valid: value.length === 12,
    companyName: isBin ? "ТОО \"Демо Компания\"" : undefined,
    source: "ГБД ЮЛ/ФЛ (mock)",
  };
  await log("iin_bin_check", "response", response, "ok");
  return response;
}

export async function mockEsignSign(documentName: string) {
  await log("esign", "request", { documentName }, "ok");
  const response = {
    documentName,
    signed: true,
    signatureId: `ESIGN-${Date.now()}`,
    signedAt: new Date().toISOString(),
    source: "НУЦ ЭЦП (mock)",
  };
  await log("esign", "response", response, "ok");
  return response;
}

export async function mockBpmSubmit(applicationNumber: string, organizationCode: string) {
  await log("bpm_submit", "request", { applicationNumber, organizationCode }, "ok");
  const response = {
    applicationNumber,
    bpmCaseId: `BPM-${organizationCode}-${Date.now()}`,
    accepted: true,
    source: `BPM ${organizationCode} (mock)`,
  };
  await log("bpm_submit", "response", response, "ok");
  return response;
}

export async function mockBpmStatus(applicationNumber: string) {
  await log("bpm_status", "request", { applicationNumber }, "ok");
  const statuses = ["IN_REVIEW", "ADDITIONAL_INFO_REQUIRED", "APPROVED"];
  const response = {
    applicationNumber,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    source: "BPM (mock)",
  };
  await log("bpm_status", "response", response, "ok");
  return response;
}

export async function mockNotifySend(channel: "sms" | "email", to: string, message: string) {
  await log("notify_" + channel, "request", { to, message }, "ok");
  const response = { to, delivered: true, source: `Notify ${channel} (mock)` };
  await log("notify_" + channel, "response", response, "ok");
  return response;
}

export async function mockDocExchange(fileName: string) {
  await log("doc_exchange", "request", { fileName }, "ok");
  const response = { fileName, stored: true, url: `#mock-doc/${encodeURIComponent(fileName)}`, source: "Хранилище документов (mock)" };
  await log("doc_exchange", "response", response, "ok");
  return response;
}
