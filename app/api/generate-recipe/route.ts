import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-helper'
import Anthropic from '@anthropic-ai/sdk'
import { checkRateLimit } from '@/lib/rate-limit'

const categoryInstructions: Record<string, string> = {
  'high-protein': 'Minimum 35g protein per serving. Carbs can be moderate.',
  'keto': 'Maximum 10g net carbs. At least 60% of calories from healthy fats.',
  'low-carb': 'Maximum 20g net carbs. High protein, moderate fat.',
  'mediterranean': 'Use olive oil, fish, legumes, vegetables, whole grains. Heart-healthy.',
  'anti-inflammatory': 'Include turmeric, ginger, omega-3 rich foods, colourful vegetables, antioxidants.',
  'whole30': 'No grains, dairy, added sugar, legumes, alcohol, or processed foods.',
  'balanced': 'Balanced macros: protein 30%, carbs 40%, fat 30%. Whole foods only.',
}

// Proteinas variadas por categoria para forcar diversidade
const proteinOptions: Record<string, string[]> = {
  'high-protein': ['frango', 'peru', 'atum', 'ovos', 'tofu', 'carne de novilho', 'camarão', 'lentilhas', 'salmão', 'bacalhau', 'cottage cheese'],
  'keto': ['frango com pele', 'costeletas de porco', 'carne picada', 'ovos', 'queijo halloumi', 'camarão', 'peito de pato', 'bife', 'linguiça', 'barriga de porco'],
  'low-carb': ['frango', 'peru', 'atum', 'lombo de porco', 'camarão', 'ovos', 'bife', 'tofu', 'salmão'],
  'mediterranean': ['bacalhau', 'sardinha', 'polvo', 'camarão', 'frango', 'lentilhas', 'grão-de-bico', 'atum', 'dourada', 'robalo', 'borrego'],
  'anti-inflammatory': ['salmão', 'sardinha', 'frango', 'lentilhas', 'tofu', 'grão-de-bico', 'camarão', 'atum', 'peru'],
  'whole30': ['frango', 'bife', 'lombo de porco', 'peru', 'salmão', 'camarão', 'atum', 'ovos', 'pato'],
  'balanced': ['frango', 'salmão', 'peru', 'atum', 'ovos', 'tofu', 'carne picada', 'bacalhau', 'lentilhas', 'camarão'],
}

// Imagens curadas por categoria (Unsplash photo IDs)
const categoryImages: Record<string, string[]> = {
  'high-protein': [
    'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop',
  ],
  'keto': [
    'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1485921325833-c519f76c4927?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1432139509613-5c4255a1d936?w=800&h=500&fit=crop',
  ],
  'low-carb': [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=500&fit=crop',
  ],
  'mediterranean': [
    'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800&h=500&fit=crop',
  ],
  'anti-inflammatory': [
    'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1511690743698-d9d18f7e20f1?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=500&fit=crop',
  ],
  'whole30': [
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&h=500&fit=crop',
  ],
  'balanced': [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=500&fit=crop',
  ],
}

function getRandomImage(category: string): string {
  const pool = categoryImages[category] ?? categoryImages['balanced']
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Mock recipes por categoria (fallback quando API indisponivel) ──

interface MockBase {
  name: string
  description: string
  ingredients: { item: string; quantity: string; unit: string; category: string }[]
  instructions: { step: number; text: string; duration_minutes: number }[]
  macros: { calories: number; protein_g: number; carbs_g: number; net_carbs_g: number; fat_g: number; fiber_g: number }
  prep: number
  cook: number
  tips: string[]
  tags: string[]
}

const mockPool: Record<string, MockBase[]> = {
  'high-protein': [
    { name: 'Frango Grelhado com Quinoa e Legumes', description: 'Peito de frango suculento sobre quinoa com legumes salteados. Rica em proteina e fibra.', ingredients: [{ item: 'peito de frango', quantity: '400', unit: 'g', category: 'protein' }, { item: 'quinoa', quantity: '150', unit: 'g', category: 'grain' }, { item: 'brócolos', quantity: '200', unit: 'g', category: 'vegetable' }, { item: 'azeite', quantity: '2', unit: 'c. sopa', category: 'fat' }, { item: 'limão', quantity: '1', unit: 'un.', category: 'fruit' }], instructions: [{ step: 1, text: 'Cozer a quinoa em água com sal durante 15 minutos.', duration_minutes: 15 }, { step: 2, text: 'Temperar o frango com limão, sal e pimenta. Grelhar 6 min de cada lado.', duration_minutes: 12 }, { step: 3, text: 'Saltear os brócolos em azeite até ficarem al dente.', duration_minutes: 5 }, { step: 4, text: 'Servir o frango fatiado sobre a quinoa com os brócolos ao lado.', duration_minutes: 2 }], macros: { calories: 480, protein_g: 45, carbs_g: 35, net_carbs_g: 30, fat_g: 14, fiber_g: 5 }, prep: 10, cook: 20, tips: ['Marinar o frango 30 min antes para mais sabor.', 'Substituir quinoa por arroz integral se preferir.'], tags: ['high-protein', 'meal-prep'] },
    { name: 'Bowl de Atum com Arroz e Abacate', description: 'Bowl inspirado em poke com atum fresco, arroz integral e abacate cremoso. Proteina completa.', ingredients: [{ item: 'atum fresco', quantity: '300', unit: 'g', category: 'protein' }, { item: 'arroz integral', quantity: '150', unit: 'g', category: 'grain' }, { item: 'abacate', quantity: '1', unit: 'un.', category: 'fat' }, { item: 'edamame', quantity: '100', unit: 'g', category: 'protein' }, { item: 'molho de soja', quantity: '2', unit: 'c. sopa', category: 'seasoning' }, { item: 'sementes de sesamo', quantity: '1', unit: 'c. sopa', category: 'seasoning' }], instructions: [{ step: 1, text: 'Cozer o arroz integral conforme instrucoes da embalagem.', duration_minutes: 25 }, { step: 2, text: 'Cortar o atum em cubos e temperar com molho de soja.', duration_minutes: 3 }, { step: 3, text: 'Montar o bowl: arroz na base, atum, abacate fatiado e edamame.', duration_minutes: 5 }, { step: 4, text: 'Polvilhar com sesamo e servir.', duration_minutes: 1 }], macros: { calories: 520, protein_g: 42, carbs_g: 38, net_carbs_g: 32, fat_g: 20, fiber_g: 6 }, prep: 10, cook: 25, tips: ['Usar atum de qualidade sashimi.', 'Adicionar gengibre ralado para mais sabor.'], tags: ['high-protein', 'omega-3'] },
    { name: 'Omelete Proteica de Espinafres e Feta', description: 'Omelete fofa recheada com espinafres e queijo feta. Rapida e nutritiva.', ingredients: [{ item: 'ovos', quantity: '4', unit: 'un.', category: 'protein' }, { item: 'espinafres', quantity: '100', unit: 'g', category: 'vegetable' }, { item: 'queijo feta', quantity: '40', unit: 'g', category: 'dairy' }, { item: 'azeite', quantity: '1', unit: 'c. sopa', category: 'fat' }], instructions: [{ step: 1, text: 'Bater os ovos com sal e pimenta.', duration_minutes: 2 }, { step: 2, text: 'Aquecer azeite e saltear os espinafres 1 minuto.', duration_minutes: 2 }, { step: 3, text: 'Verter os ovos e cozinhar em lume brando. Adicionar feta e dobrar.', duration_minutes: 5 }], macros: { calories: 380, protein_g: 28, carbs_g: 4, net_carbs_g: 3, fat_g: 28, fiber_g: 1 }, prep: 5, cook: 8, tips: ['Adicionar cogumelos para mais volume.', 'Servir com pao integral torrado.'], tags: ['high-protein', 'quick', 'low-carb'] },
  ],
  'keto': [
    { name: 'Salmao com Manteiga de Ervas e Espargos', description: 'Salmao grelhado com manteiga de ervas aromáticas e espargos crocantes. Perfeito para keto.', ingredients: [{ item: 'lombos de salmao', quantity: '300', unit: 'g', category: 'protein' }, { item: 'espargos', quantity: '200', unit: 'g', category: 'vegetable' }, { item: 'manteiga', quantity: '30', unit: 'g', category: 'fat' }, { item: 'alho', quantity: '2', unit: 'dentes', category: 'seasoning' }, { item: 'limao', quantity: '1', unit: 'un.', category: 'fruit' }, { item: 'endro fresco', quantity: '1', unit: 'c. sopa', category: 'seasoning' }], instructions: [{ step: 1, text: 'Preparar manteiga de ervas: misturar manteiga amolecida com alho picado e endro.', duration_minutes: 3 }, { step: 2, text: 'Grelhar o salmao 4-5 min de cada lado.', duration_minutes: 10 }, { step: 3, text: 'Grelhar os espargos com azeite 3-4 minutos.', duration_minutes: 4 }, { step: 4, text: 'Servir o salmao com a manteiga de ervas por cima e espargos ao lado.', duration_minutes: 2 }], macros: { calories: 450, protein_g: 35, carbs_g: 6, net_carbs_g: 4, fat_g: 32, fiber_g: 2 }, prep: 8, cook: 15, tips: ['Nao cozer demais o salmao — deve ficar rosado no centro.', 'Substituir espargos por courgette grelhada.'], tags: ['keto', 'omega-3', 'quick'] },
    { name: 'Courgette Recheada com Carne e Queijo', description: 'Courgettes assadas recheadas com carne picada e gratinadas com queijo. Baixa em hidratos.', ingredients: [{ item: 'courgettes grandes', quantity: '2', unit: 'un.', category: 'vegetable' }, { item: 'carne picada', quantity: '250', unit: 'g', category: 'protein' }, { item: 'queijo mozzarella', quantity: '80', unit: 'g', category: 'dairy' }, { item: 'tomate pelado', quantity: '100', unit: 'g', category: 'vegetable' }, { item: 'cebola', quantity: '1', unit: 'un.', category: 'vegetable' }], instructions: [{ step: 1, text: 'Cortar courgettes ao meio e escavar o centro.', duration_minutes: 5 }, { step: 2, text: 'Refogar cebola e carne, juntar tomate e temperar.', duration_minutes: 10 }, { step: 3, text: 'Rechear courgettes, cobrir com mozzarella e assar a 190°C por 20 min.', duration_minutes: 20 }], macros: { calories: 420, protein_g: 32, carbs_g: 10, net_carbs_g: 7, fat_g: 28, fiber_g: 3 }, prep: 10, cook: 30, tips: ['Usar carne de novilho magra para menos gordura.', 'Adicionar oregaos e manjericao ao recheio.'], tags: ['keto', 'low-carb', 'meal-prep'] },
  ],
  'low-carb': [
    { name: 'Peito de Peru com Salada de Abacate', description: 'Peito de peru grelhado com salada fresca de abacate, tomate cherry e rúcula. Leve e saciante.', ingredients: [{ item: 'peito de peru', quantity: '300', unit: 'g', category: 'protein' }, { item: 'abacate', quantity: '1', unit: 'un.', category: 'fat' }, { item: 'tomate cherry', quantity: '150', unit: 'g', category: 'vegetable' }, { item: 'rúcula', quantity: '80', unit: 'g', category: 'vegetable' }, { item: 'azeite', quantity: '2', unit: 'c. sopa', category: 'fat' }], instructions: [{ step: 1, text: 'Temperar o peru com sal, pimenta e ervas. Grelhar 5 min de cada lado.', duration_minutes: 10 }, { step: 2, text: 'Preparar salada: rúcula, tomate cortado ao meio, abacate em cubos.', duration_minutes: 5 }, { step: 3, text: 'Temperar com azeite e limao. Servir com o peru fatiado por cima.', duration_minutes: 3 }], macros: { calories: 410, protein_g: 38, carbs_g: 12, net_carbs_g: 8, fat_g: 24, fiber_g: 4 }, prep: 8, cook: 12, tips: ['Marinar o peru em limao e alho para mais sabor.', 'Adicionar nozes para mais textura.'], tags: ['low-carb', 'quick', 'fresh'] },
  ],
  'mediterranean': [
    { name: 'Bacalhau a Brás', description: 'Classico portugues com bacalhau desfiado, batata palha e ovos. Conforto puro.', ingredients: [{ item: 'bacalhau demolhado', quantity: '300', unit: 'g', category: 'protein' }, { item: 'batata palha', quantity: '150', unit: 'g', category: 'vegetable' }, { item: 'ovos', quantity: '4', unit: 'un.', category: 'protein' }, { item: 'cebola', quantity: '2', unit: 'un.', category: 'vegetable' }, { item: 'azeite', quantity: '3', unit: 'c. sopa', category: 'fat' }, { item: 'salsa e azeitonas', quantity: '1', unit: 'punhado', category: 'seasoning' }], instructions: [{ step: 1, text: 'Desfiar o bacalhau em lascas, retirar espinhas e pele.', duration_minutes: 10 }, { step: 2, text: 'Refogar cebola em azeite até dourar. Juntar o bacalhau e saltear.', duration_minutes: 8 }, { step: 3, text: 'Adicionar batata palha e ovos batidos. Mexer até os ovos ficarem cremosos.', duration_minutes: 5 }, { step: 4, text: 'Decorar com salsa e azeitonas. Servir quente.', duration_minutes: 2 }], macros: { calories: 490, protein_g: 38, carbs_g: 28, net_carbs_g: 25, fat_g: 24, fiber_g: 3 }, prep: 15, cook: 15, tips: ['Os ovos devem ficar cremosos, nao secos.', 'Usar bacalhau de qualidade — faz toda a diferenca.'], tags: ['mediterranean', 'portuguese', 'comfort-food'] },
    { name: 'Salada Grega com Grão e Feta', description: 'Salada mediterranica vibrante com grao-de-bico, pepino, tomate e feta. Fresca e nutritiva.', ingredients: [{ item: 'grao-de-bico cozido', quantity: '200', unit: 'g', category: 'protein' }, { item: 'pepino', quantity: '1', unit: 'un.', category: 'vegetable' }, { item: 'tomate', quantity: '2', unit: 'un.', category: 'vegetable' }, { item: 'queijo feta', quantity: '100', unit: 'g', category: 'dairy' }, { item: 'azeitonas kalamata', quantity: '50', unit: 'g', category: 'fat' }, { item: 'azeite extra virgem', quantity: '3', unit: 'c. sopa', category: 'fat' }], instructions: [{ step: 1, text: 'Cortar pepino e tomate em cubos. Escorrer o grao.', duration_minutes: 5 }, { step: 2, text: 'Misturar tudo numa tigela. Juntar azeitonas.', duration_minutes: 3 }, { step: 3, text: 'Esfarelhar o feta por cima. Temperar com azeite, oregaos e limao.', duration_minutes: 3 }], macros: { calories: 420, protein_g: 18, carbs_g: 32, net_carbs_g: 24, fat_g: 26, fiber_g: 8 }, prep: 10, cook: 0, tips: ['Servir fria para melhor sabor.', 'Adicionar cebola roxa fatiada finamente.'], tags: ['mediterranean', 'vegetarian', 'no-cook'] },
  ],
  'anti-inflammatory': [
    { name: 'Caril de Grao com Curcuma e Gengibre', description: 'Caril cremoso de grao-de-bico com curcuma, gengibre e leite de coco. Anti-inflamatorio e reconfortante.', ingredients: [{ item: 'grao-de-bico cozido', quantity: '300', unit: 'g', category: 'protein' }, { item: 'leite de coco', quantity: '200', unit: 'ml', category: 'fat' }, { item: 'curcuma em po', quantity: '1', unit: 'c. cha', category: 'seasoning' }, { item: 'gengibre fresco', quantity: '2', unit: 'cm', category: 'seasoning' }, { item: 'espinafres', quantity: '100', unit: 'g', category: 'vegetable' }, { item: 'tomate pelado', quantity: '200', unit: 'g', category: 'vegetable' }], instructions: [{ step: 1, text: 'Refogar cebola, alho, gengibre e curcuma em azeite.', duration_minutes: 5 }, { step: 2, text: 'Juntar tomate pelado e leite de coco. Deixar ferver 5 min.', duration_minutes: 5 }, { step: 3, text: 'Adicionar grao-de-bico e espinafres. Cozinhar mais 10 min.', duration_minutes: 10 }, { step: 4, text: 'Temperar com sal e pimenta preta (activa a curcuma). Servir.', duration_minutes: 2 }], macros: { calories: 380, protein_g: 15, carbs_g: 35, net_carbs_g: 26, fat_g: 20, fiber_g: 9 }, prep: 8, cook: 22, tips: ['Pimenta preta aumenta a absorcao da curcuma em 2000%.', 'Servir com arroz basmati ou naan.'], tags: ['anti-inflammatory', 'vegan', 'comfort-food'] },
  ],
  'whole30': [
    { name: 'Bife com Puré de Couve-flor e Cogumelos', description: 'Bife suculento com puré de couve-flor cremoso e cogumelos salteados. Whole30 compliant.', ingredients: [{ item: 'bife de novilho', quantity: '300', unit: 'g', category: 'protein' }, { item: 'couve-flor', quantity: '300', unit: 'g', category: 'vegetable' }, { item: 'cogumelos', quantity: '150', unit: 'g', category: 'vegetable' }, { item: 'ghee', quantity: '2', unit: 'c. sopa', category: 'fat' }, { item: 'alho', quantity: '2', unit: 'dentes', category: 'seasoning' }], instructions: [{ step: 1, text: 'Cozer a couve-flor em água com sal 12 min. Escorrer e triturar com ghee.', duration_minutes: 15 }, { step: 2, text: 'Saltear cogumelos fatiados com alho em ghee até dourar.', duration_minutes: 6 }, { step: 3, text: 'Grelhar o bife ao ponto desejado (3-4 min cada lado para mal passado).', duration_minutes: 8 }, { step: 4, text: 'Deixar repousar 3 min. Servir com puré e cogumelos.', duration_minutes: 3 }], macros: { calories: 460, protein_g: 40, carbs_g: 12, net_carbs_g: 8, fat_g: 28, fiber_g: 4 }, prep: 10, cook: 25, tips: ['Retirar o bife do frigorifico 20 min antes de grelhar.', 'O puré de couve-flor substitui perfeitamente o puré de batata.'], tags: ['whole30', 'paleo', 'high-protein'] },
  ],
  'balanced': [
    { name: 'Salmao ao Forno com Batata-Doce e Brócolos', description: 'Salmao assado com crosta de ervas, batata-doce caramelizada e brócolos. Equilibrio perfeito.', ingredients: [{ item: 'lombos de salmao', quantity: '300', unit: 'g', category: 'protein' }, { item: 'batata-doce', quantity: '300', unit: 'g', category: 'vegetable' }, { item: 'brócolos', quantity: '200', unit: 'g', category: 'vegetable' }, { item: 'azeite', quantity: '2', unit: 'c. sopa', category: 'fat' }, { item: 'alho e ervas', quantity: '1', unit: 'c. cha', category: 'seasoning' }], instructions: [{ step: 1, text: 'Pre-aquecer o forno a 200°C. Cortar batata-doce em cubos e temperar.', duration_minutes: 5 }, { step: 2, text: 'Assar a batata-doce 15 minutos.', duration_minutes: 15 }, { step: 3, text: 'Colocar salmao e brócolos no tabuleiro. Assar mais 12 minutos.', duration_minutes: 12 }], macros: { calories: 520, protein_g: 35, carbs_g: 40, net_carbs_g: 34, fat_g: 22, fiber_g: 6 }, prep: 10, cook: 27, tips: ['Nao cozer demais o salmao — deve ficar rosado no centro.', 'Espremer limao por cima antes de servir.'], tags: ['balanced', 'omega-3', 'meal-prep'] },
    { name: 'Arroz de Frango com Legumes Salteados', description: 'Arroz basmati com frango desfiado e legumes coloridos salteados. Classico equilibrado.', ingredients: [{ item: 'peito de frango', quantity: '300', unit: 'g', category: 'protein' }, { item: 'arroz basmati', quantity: '150', unit: 'g', category: 'grain' }, { item: 'cenoura', quantity: '1', unit: 'un.', category: 'vegetable' }, { item: 'ervilhas', quantity: '80', unit: 'g', category: 'vegetable' }, { item: 'pimento', quantity: '1', unit: 'un.', category: 'vegetable' }, { item: 'azeite', quantity: '2', unit: 'c. sopa', category: 'fat' }], instructions: [{ step: 1, text: 'Cozer o arroz conforme instrucoes. Reservar.', duration_minutes: 15 }, { step: 2, text: 'Grelhar o frango e desfiar em tiras.', duration_minutes: 12 }, { step: 3, text: 'Saltear legumes cortados em cubos com azeite. Juntar frango e arroz.', duration_minutes: 8 }], macros: { calories: 480, protein_g: 35, carbs_g: 48, net_carbs_g: 44, fat_g: 14, fiber_g: 4 }, prep: 10, cook: 25, tips: ['Adicionar molho de soja para um toque asiatico.', 'Pode ser feito em grande quantidade para meal-prep.'], tags: ['balanced', 'meal-prep', 'family-friendly'] },
  ],
}

function getMockRecipe(category: string, mealType: string, servings: number) {
  const pool = mockPool[category] ?? mockPool['balanced']
  // Seleccionar aleatoriamente do pool
  const idx = Math.floor(Math.random() * pool.length)
  const base = pool[idx]
  return {
    name: base.name,
    description: base.description,
    category,
    meal_type: mealType,
    prep_time_minutes: base.prep,
    cook_time_minutes: base.cook,
    servings,
    difficulty: 'easy',
    macros_per_serving: base.macros,
    ingredients: base.ingredients,
    instructions: base.instructions,
    tips: base.tips,
    substitutions: ['Adaptar ingredientes conforme disponibilidade.'],
    meal_prep_note: 'Conserva-se 3 dias no frigorifico.',
    tags: base.tags,
    imageUrl: getRandomImage(category),
    _mock: true,
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = checkRateLimit(`generate-recipe:${userId}`, { limit: 30, windowMs: 60_000 })
  if (!rl.allowed) return NextResponse.json({ error: 'Demasiados pedidos.' }, { status: 429 })

  const { category, mealType, preferences, availableIngredients, cookingTime, servings, cuisine } = await req.json()

  const apiKey = process.env.RECIPE_AI_API_KEY
  if (!apiKey || apiKey === 'TODO') {
    return NextResponse.json({ recipe: getMockRecipe(category, mealType, servings ?? 2) })
  }

  const client = new Anthropic({ apiKey })

  // Escolher proteina aleatoria para forcar variedade
  const proteins = proteinOptions[category] ?? proteinOptions['balanced']
  const mainProtein = proteins[Math.floor(Math.random() * proteins.length)]
  const avoidProteins = proteins.filter(p => p !== mainProtein).slice(0, 3)

  const systemPrompt = `You are a professional nutritionist and chef specializing in healthy, goal-oriented meal preparation. Generate practical, delicious recipes that real people can cook at home. Always respond in Portuguese (Portugal).

Category rule for this recipe: ${categoryInstructions[category] ?? 'Balanced and nutritious.'}

CRITICAL RULES FOR VARIETY:
- The MAIN protein for this recipe MUST be: ${mainProtein}
- Do NOT use: ${avoidProteins.join(', ')} as the main protein
- Be creative with cooking methods: grill, oven, stir-fry, stew, wrap, salad, soup, casserole
- Use diverse side dishes and vegetables — avoid always pairing with the same sides
- Draw inspiration from different cuisines: portuguesa, italiana, asiática, mexicana, indiana, marroquina

ALWAYS respond with valid JSON only. No markdown, no explanation, only the JSON object.

JSON structure:
{
  "name": "Recipe Name",
  "description": "2-sentence appetizing description",
  "category": "${category}",
  "meal_type": "${mealType}",
  "prep_time_minutes": 10,
  "cook_time_minutes": 20,
  "servings": ${servings ?? 2},
  "difficulty": "easy",
  "macros_per_serving": {
    "calories": 0,
    "protein_g": 0,
    "carbs_g": 0,
    "net_carbs_g": 0,
    "fat_g": 0,
    "fiber_g": 0
  },
  "ingredients": [
    { "item": "chicken breast", "quantity": "300", "unit": "g", "category": "protein" }
  ],
  "instructions": [
    { "step": 1, "text": "...", "duration_minutes": 5 }
  ],
  "tips": ["Tip 1", "Tip 2"],
  "substitutions": ["Replace X with Y for dairy-free version"],
  "meal_prep_note": "Can be stored X days in fridge",
  "tags": ["high-protein", "meal-prep"]
}`

  const userPrompt = `Generate a ${mealType} recipe in the ${category} category.
${availableIngredients ? `Use these ingredients if possible: ${availableIngredients}` : ''}
${cuisine ? `Cuisine style: ${cuisine}` : ''}
${preferences?.length ? `Additional preferences: ${preferences.join(', ')}` : ''}
Cooking time available: ${cookingTime ?? '30 minutes'}
Servings needed: ${servings ?? 2}
Random seed: ${Date.now()}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
      temperature: 1,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    let text = response.content[0].type === 'text' ? response.content[0].text : ''
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    // Tentar extrair JSON do texto
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ recipe: getMockRecipe(category, mealType, servings ?? 2) })
    }
    let recipe: Record<string, unknown>
    try {
      recipe = JSON.parse(jsonMatch[0])
    } catch {
      // JSON invalido — fallback para mock
      return NextResponse.json({ recipe: getMockRecipe(category, mealType, servings ?? 2) })
    }
    recipe.imageUrl = getRandomImage(category)

    return NextResponse.json({ recipe })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    if (msg.includes('credit balance') || msg.includes('authentication_error')) {
      return NextResponse.json({ recipe: getMockRecipe(category, mealType, servings ?? 2) })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
