
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { GeneratedContent, VisualStyle, ScriptLine, StoryLength, PassengerGender, DriverGender, DriverAge, PassengerAge } from "../types";
import { SYSTEM_PROMPT_TEMPLATE } from "../constants";

// --- 사용자 제공 구글 TTS 목소리 분류 리스트 (성별 및 특징 정밀 반영) ---
const VOICE_POOL = {
  male: [
    { name: 'Charon', desc: '깊고 신뢰감 있는 뉴스 앵커 톤', tone: '정보 전달', age: 'middle-old' },
    { name: 'Orus', desc: '자신감 넘치고 힘 있는 목소리', tone: '단호함', age: 'middle' },
    { name: 'Fenrir', desc: '에너지가 넘치고 거친 느낌', tone: '흥분된', age: 'young-middle' },
    { name: 'Puck', desc: '장난기 있고 가벼운 남성', tone: '경쾌함', age: 'young' },
    { name: 'Zephyr', desc: '부드러운 미성 (중성적 매력)', tone: '밝음', age: 'young-middle' },
    { name: 'Alnilam', desc: '진지하고 무게감 있음', tone: '단호함', age: 'middle-old' },
    { name: 'Enceladus', desc: '자연스럽고 낮은 톤, 약간의 거친 숨소리', tone: '숨소리', age: 'middle' },
    { name: 'Algenib', desc: '허스키하고 개성 있는 톤', tone: '거친', age: 'middle' },
    { name: 'Gacrux', desc: '중후한 중년 남성의 느낌', tone: '성숙함', age: 'old' },
    { name: 'Iapetus', desc: '깨끗하고 명확한 남성 보이스', tone: '또렷함', age: 'young-middle' },
    { name: 'Schedar', desc: '안정적인 내레이션 톤', tone: '차분함', age: 'middle' },
    { name: 'Achird', desc: '다정다감한 남성', tone: '친절함', age: 'middle-old' }
  ],
  female: [
    { name: 'Kore', desc: '똑부러지는 전문직 여성 느낌', tone: '단호함', age: 'middle' },
    { name: 'Aoede', desc: '상쾌하고 높은 톤', tone: '산들바람', age: 'young' },
    { name: 'Leda', desc: '발랄한 20대 여성 느낌', tone: '젊음', age: 'young' },
    { name: 'Umbriel', desc: '차분하고 우아한 톤', tone: '느긋함', age: 'middle-old' },
    { name: 'Callirrhoe', desc: '편안하고 나긋나긋함', tone: '느긋함', age: 'middle' },
    { name: 'Vindemiatrix', desc: '부드럽고 친절한 상담원 톤', tone: '온화함', age: 'middle' },
    { name: 'Sulafat', desc: '엄마같이 포근한 목소리', tone: '따뜻함', age: 'old' },
    { name: 'Erinome', desc: '깨끗하고 투명한 목소리', tone: '맑음', age: 'young' },
    { name: 'Laomedeia', desc: '하이텐션의 활기찬 목소리', tone: '신나는', age: 'young-middle' },
    { name: 'Pulcherrima', desc: '당당하고 시원시원함', tone: '직설적', age: 'middle' },
    { name: 'Rasalgethi', desc: '차분한 여성 아나운서 톤', tone: '정보 전달', age: 'middle-old' }
  ]
};

const getSystemPrompt = (style: VisualStyle, length: StoryLength, passengerGender: PassengerGender, driverGender: DriverGender, driverAge: DriverAge, passengerAge: PassengerAge) => {
  const lengthMap = {
    '1min': { desc: '약 1분 (짧고 강렬한 여운)', count: 4 },
    '3min': { desc: '약 3분 (기승전결이 확실한 서사)', count: 12 },
    '5min': { desc: '약 5분 (깊이 있는 대화와 감동)', count: 20 }
  };
  
  const config = lengthMap[length];
  
  return SYSTEM_PROMPT_TEMPLATE
    .replace("{STYLE}", style)
    .replace("{LENGTH}", length)
    .replace("{LENGTH_DESC}", config.desc)
    .replace(/{PASSENGER_GENDER}/g, passengerGender === 'male' ? '남성' : '여성')
    .replace(/{DRIVER_GENDER}/g, driverGender === 'male' ? '남성' : '여성')
    .replace(/{DRIVER_AGE}/g, driverAge)
    .replace(/{PASSENGER_AGE}/g, passengerAge)
    .replace("{IMAGE_COUNT}", config.count.toString());
};

const jsonSchema = {
    type: Type.OBJECT,
    properties: {
      analysis: { type: Type.STRING },
      script: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING },
            text: { type: Type.STRING },
            direction: { type: Type.STRING },
          },
          required: ["speaker", "text"],
        },
      },
      pythonCode: { type: Type.STRING },
      imagePrompts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            scene: { type: Type.STRING },
            prompt: { type: Type.STRING },
          },
          required: ["scene", "prompt"],
        },
      },
      metadata: {
        type: Type.OBJECT,
        properties: {
          titles: { type: Type.ARRAY, items: { type: Type.STRING } },
          description: { type: Type.STRING },
          thumbnailText: { type: Type.STRING },
          summary: { type: Type.STRING },
          hashtags: { type: Type.STRING },
          keywords: { type: Type.STRING },
        },
        required: ["titles", "description", "thumbnailText", "summary", "hashtags", "keywords"],
      },
    },
    required: ["analysis", "script", "pythonCode", "imagePrompts", "metadata"],
} as Schema;

export const generateStoryAssets = async (
  topic: string,
  style: VisualStyle,
  length: StoryLength,
  passengerGender: PassengerGender,
  driverGender: DriverGender,
  driverAge: DriverAge,
  passengerAge: PassengerAge
): Promise<GeneratedContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: `Topic: ${topic}` }] }],
    config: {
      systemInstruction: getSystemPrompt(style, length, passengerGender, driverGender, driverAge, passengerAge),
      responseMimeType: "application/json",
      responseSchema: jsonSchema,
    },
  });
  return JSON.parse(response.text) as GeneratedContent;
};

/**
 * 스크립트 내용을 분석하여 설정된 성별과 나이대에 가장 적합한 목소리를 풀(Pool) 내에서 엄격하게 선정합니다.
 */
const selectBestVoices = async (
    script: ScriptLine[],
    driverGender: DriverGender,
    passengerGender: PassengerGender,
    driverAge: DriverAge,
    passengerAge: PassengerAge
): Promise<{ driverVoice: string; passengerVoice: string; reasoning: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const driverPoolStr = VOICE_POOL[driverGender].map(v => `${v.name} (${v.desc}, 느낌:${v.tone}, 연령대:${v.age})`).join(', ');
    const passengerPoolStr = VOICE_POOL[passengerGender].map(v => `${v.name} (${v.desc}, 느낌:${v.tone}, 연령대:${v.age})`).join(', ');

    const scriptSample = script.slice(0, 10).map(l => `${l.speaker}: ${l.text}`).join('\n');

    const prompt = `
    당신은 라디오 드라마 캐스팅 디렉터입니다. 
    설정된 성별과 나이대에 맞지 않는 목소리를 선택하면 방송 사고입니다. 반드시 규칙을 지키세요.

    [캐스팅 대상 및 조건]
    1. 기사님: 반드시 성별 [${driverGender === 'male' ? '남성' : '여성'}] 후보에서만 선택하세요. 설정 연령대는 [${driverAge}] 입니다.
    2. 승객: 반드시 성별 [${passengerGender === 'male' ? '남성' : '여성'}] 후보에서만 선택하세요. 설정 연령대는 [${passengerAge}] 입니다.

    [기사님 선택 가능 후보 (${driverGender === 'male' ? '남성 전용' : '여성 전용'})]
    ${driverPoolStr}

    [승객 선택 가능 후보 (${passengerGender === 'male' ? '남성 전용' : '여성 전용'})]
    ${passengerPoolStr}

    [대본 내용]
    ${scriptSample}

    [선정 지침]
    - 기사님 성별이 ${driverGender}이면 절대로 여성 목소리를 선택하지 마세요. 그 반대도 마찬가지입니다.
    - 나이대(20s~70s)와 목소리의 연령대(young/middle/old)를 최대한 매칭하세요.

    결과를 JSON으로만 출력하세요:
    {
        "driverVoice": "선정된 Voice Name",
        "passengerVoice": "선정된 Voice Name",
        "reasoning": "성별과 연령대 매칭 근거"
    }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    driverVoice: { type: Type.STRING },
                    passengerVoice: { type: Type.STRING },
                    reasoning: { type: Type.STRING }
                },
                required: ["driverVoice", "passengerVoice", "reasoning"]
            }
        }
    });

    const result = JSON.parse(response.text);

    let finalDriverVoice = result.driverVoice;
    let finalPassengerVoice = result.passengerVoice;

    const isValidDriver = VOICE_POOL[driverGender].some(v => v.name === finalDriverVoice);
    if (!isValidDriver) {
        if (driverAge.includes('60') || driverAge.includes('70')) {
            finalDriverVoice = driverGender === 'male' ? 'Gacrux' : 'Sulafat';
        } else {
            finalDriverVoice = driverGender === 'male' ? 'Achird' : 'Vindemiatrix';
        }
    }

    const isValidPassenger = VOICE_POOL[passengerGender].some(v => v.name === finalPassengerVoice);
    if (!isValidPassenger) {
        if (passengerAge.includes('20') || passengerAge.includes('30')) {
            finalPassengerVoice = passengerGender === 'male' ? 'Puck' : 'Leda';
        } else if (passengerAge.includes('40') || passengerAge.includes('50')) {
            finalPassengerVoice = passengerGender === 'male' ? 'Iapetus' : 'Kore';
        } else {
            finalPassengerVoice = passengerGender === 'male' ? 'Gacrux' : 'Sulafat';
        }
    }

    return {
        driverVoice: finalDriverVoice,
        passengerVoice: finalPassengerVoice,
        reasoning: result.reasoning
    };
};

export const generateConversationAudio = async (
  script: ScriptLine[],
  driverGender: DriverGender,
  passengerGender: PassengerGender,
  driverAge: DriverAge,
  passengerAge: PassengerAge
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let voiceSelection;
  try {
      voiceSelection = await selectBestVoices(script, driverGender, passengerGender, driverAge, passengerAge);
  } catch (e) {
      voiceSelection = {
          driverVoice: driverGender === 'male' ? 'Gacrux' : 'Sulafat',
          passengerVoice: passengerGender === 'male' ? 'Puck' : 'Leda',
          reasoning: "Fallback to default voices"
      };
  }

  const conversationText = script
    .map((line) => `${line.speaker}: ${line.text}`)
    .join("\n");

  const prompt = `아래 한국어 대화를 라디오 드라마 품질의 오디오로 변환하세요.

화자 매핑 (STRICT):
- 화자 'Driver' (성별:${driverGender === 'male' ? '남성' : '여성'}, 나이:${driverAge}): 목소리 모델 '${voiceSelection.driverVoice}'를 사용하세요.
- 화자 'Passenger' (성별:${passengerGender === 'male' ? '남성' : '여성'}, 나이:${passengerAge}): 목소리 모델 '${voiceSelection.passengerVoice}'를 사용하세요.

지침:
1. 대본의 화자 이름(Driver:, Passenger:)에 맞춰 지정된 목소리를 정확히 할당하세요.
2. 한국어 억양과 감정 표현을 풍부하게 살려주세요.

대화 내용:
${conversationText}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: 'Driver',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceSelection.driverVoice } }
            },
            {
              speaker: 'Passenger',
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceSelection.passengerVoice } }
            }
          ]
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Audio generation failed: No data received");
  return base64Audio;
};

export const generateAIImage = async (
  basePrompt: string,
  driverGender: DriverGender,
  passengerGender: PassengerGender,
  driverAge: DriverAge,
  passengerAge: PassengerAge
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const enhancedPrompt = `
    Subject: A high-quality cinematic scene of a South Korean Taxi.
    
    STRICT COMPOSITION RULES (FOR AUTHENTICITY):
    1. **LEFT-HAND DRIVE (LHD)**: South Korea is a Left-Hand Drive country. 
       - The steering wheel MUST be on the LEFT side of the car.
       - The driver MUST sit on the LEFT side.
       - Explicitly: "Steering wheel located on the left side of the vehicle, Left-Hand Drive configuration."
    2. **KOREAN TAXI DETAILS**: 
       - Modern South Korean sedan taxi (white, silver, or orange).
       - A yellow rectangular license plate background (no numbers/text).
       - A 'TAXI' lantern on the roof.
    3. **HUMAN REALISM**:
       - Avoid artificial or exaggerated expressions. No fake CGI tears.
       - Use "Candid photography style, subtle emotional facial expressions, high human realism, natural skin texture."
    4. **CHARACTERS**:
       - Driver: Korean ${driverGender}, ${driverAge}.
       - Passenger: Korean ${passengerGender}, ${passengerAge}.
       - Professional Korean attire, high ethnicity fidelity.
    5. **ATMOSPHERE**: 
       - Authentic Korean street background (Seoul night lights, typical Korean asphalt and street lamps).
       - Cinematic natural lighting, 8k, photorealistic.
    6. **NO TEXT**: Absolutely NO written characters, NO letters, NO numbers anywhere.

    Scene Description: ${basePrompt}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: enhancedPrompt }] },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    },
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Image generation failed");
};
