import { DicomCase, ParsedDicomMeta } from '../types/dicom';

/**
 * Service for managing RouterPlus LLM API Gateway interaction & system prompt templates
 */
export class RouterPlusService {
  private static API_URL = 'https://api.routerplus.com/v1/chat/completions';

  /**
   * Synthesize diagnostic report using RouterPlus Gateway with Volumetric Multi-Slice Series Context
   */
  static async synthesizeReport(
    apiKey: string, 
    model: string, 
    selectedCase: DicomCase, 
    dicomMeta: ParsedDicomMeta | null,
    totalSlices: number = 1,
    currentSliceIdx: number = 0
  ): Promise<string> {
    const seriesContext = totalSlices > 1 
      ? `Volumetric Multi-Slice Series consisting of ${totalSlices} slices. Currently inspecting Frame ${currentSliceIdx + 1}/${totalSlices}.`
      : 'Single Slice DICOM Instance.';

    const systemPrompt = `You are RadVibe, an Autonomous Board-Certified Radiology AI Agent.
You are analyzing a DICOM scan (${selectedCase.modality} of ${selectedCase.region}).
Series Acquisition Context: ${seriesContext}
Extracted DICOM Header Tags: ${JSON.stringify(dicomMeta)}.
Quantitative Volumetric Measurements: ${JSON.stringify(selectedCase.measurements)}.

Generate a formal hospital Radiology Consultation Report covering the full volumetric series.
DO NOT use markdown hashtags (like ### or ##). 
Use uppercase bold headers for each section:

**CLINICAL HISTORY & TECHNIQUE**
State patient modality, region, total series slice count (${totalSlices}), and acquisition protocol.

**FINDINGS**
Provide itemized anatomical findings across the volumetric series, primary lesion diameter in mm, attenuation (HU), and slice/level distribution.

**IMPRESSION**
Primary clinical diagnostic impression derived from the multi-slice scan data.

**ICD-10 CODES**
List 2-3 relevant ICD-10 diagnostic codes.

**RECOMMENDATIONS**
Next diagnostic steps, follow-up imaging, or specialist referrals.`;

    const res = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Perform complete diagnostic analysis on DICOM ${selectedCase.title}.` }
        ]
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'RouterPlus API error');

    return data.choices?.[0]?.message?.content || '';
  }
}
