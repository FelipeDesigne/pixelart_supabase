import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RequestData {
  userName: string;
  status: string;
  createdAt: any;
  description: string;
}

const statusTranslations = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  rejected: 'Rejeitado',
};

export const exportToExcel = (data: RequestData[]) => {
  // Preparar os dados
  const rows = [
    ['Pixel Art - Relatório de Solicitações'],
    ['Gerado em: ' + format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })],
    [], // Linha vazia
    ['Usuário', 'Status', 'Data de Criação', 'Descrição']
  ];

  // Adicionar os dados
  data.forEach(item => {
    rows.push([
      item.userName,
      statusTranslations[item.status as keyof typeof statusTranslations] || item.status,
      format(item.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      item.description
    ]);
  });

  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Definir larguras das colunas
  ws['!cols'] = [
    { wch: 35 }, // Usuário
    { wch: 20 }, // Status
    { wch: 25 }, // Data
    { wch: 60 }, // Descrição
  ];

  // Criar workbook e adicionar a worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

  // Exportar o arquivo
  XLSX.writeFile(wb, `pixel-art-relatorio-${format(new Date(), 'dd-MM-yyyy-HH-mm')}.xlsx`);
};
